import { type Prisma } from '@prisma/client'

import { prisma } from '../../prisma'
import { requireR2PublicUrl, uploadObjectBuffer } from '../../storage/r2-client'
import { isManagedDatasheetUrl } from './datasheet-candidates'
import { datasheetStorageKey, downloadPdfBytes } from './pdf-file'
import {
  type DataSource,
  type DatasheetCandidate,
  type EnrichmentMeta,
} from '../types'

interface ProductRow {
  id: string
  partNumber: string
  enrichmentMeta: Prisma.JsonValue | null
}

interface StoredDatasheet {
  title: string
  url: string
  fileSize: string | null
  language: string
}

interface UploadedDatasheet {
  title: string
  url: string
  fileSize: string
  language: string
}

export interface DatasheetWorkerOptions {
  limit: number
  dryRun: boolean
}

export interface DatasheetWorkerSummary {
  selected: number
  completed: number
  failed: number
  uploaded: number
}

export async function runDatasheetWorker(
  options: DatasheetWorkerOptions,
): Promise<DatasheetWorkerSummary> {
  const publicBase = requireR2PublicUrl()
  const products = await findProducts(options.limit, publicBase)
  const summary: DatasheetWorkerSummary = {
    selected: products.length,
    completed: 0,
    failed: 0,
    uploaded: 0,
  }

  for (const product of products) {
    const rows = await loadDatasheets(product.id)
    const meta = readMeta(product.enrichmentMeta)
    const candidates = collectCandidates(product.partNumber, meta, rows, publicBase)
    if (options.dryRun) {
      console.log(`  ${product.partNumber}: PDF в очереди - ${candidates.length}`)
      continue
    }
    await processProduct(product, meta, rows, candidates, publicBase, summary)
  }

  return summary
}

async function findProducts(limit: number, publicBase: string): Promise<ProductRow[]> {
  const externalPattern = `${publicBase}/datasheets/%`
  return prisma.$queryRaw<ProductRow[]>`
    SELECT DISTINCT p.id, p."partNumber", p."enrichmentMeta"
    FROM "Product" p
    LEFT JOIN "Datasheet" d ON d."productId" = p.id
    WHERE (
      jsonb_typeof(p."enrichmentMeta"->'datasheetCandidates') = 'array'
      AND jsonb_array_length(p."enrichmentMeta"->'datasheetCandidates') > 0
    ) OR (d.id IS NOT NULL AND d.url NOT LIKE ${externalPattern})
    ORDER BY p.id
    LIMIT ${limit}
  `
}

async function loadDatasheets(productId: string): Promise<StoredDatasheet[]> {
  return prisma.datasheet.findMany({
    where: { productId },
    select: { title: true, url: true, fileSize: true, language: true },
    orderBy: { createdAt: 'asc' },
  })
}

function collectCandidates(
  partNumber: string,
  meta: EnrichmentMeta,
  rows: StoredDatasheet[],
  publicBase: string,
): DatasheetCandidate[] {
  const candidates = [...(meta.datasheetCandidates ?? [])]
  const seen = new Set(candidates.map(({ url }) => url))
  const fallbackSource = resolveSource(meta)

  for (const row of rows) {
    if (isManagedDatasheetUrl(row.url, publicBase) || seen.has(row.url)) continue
    candidates.push({
      url: row.url,
      source: fallbackSource,
      title: row.title || `${partNumber} Datasheet`,
      language: row.language === 'ru' ? 'ru' : 'en',
    })
    seen.add(row.url)
  }
  return candidates.filter(isValidCandidate)
}

async function processProduct(
  product: ProductRow,
  meta: EnrichmentMeta,
  rows: StoredDatasheet[],
  candidates: DatasheetCandidate[],
  publicBase: string,
  summary: DatasheetWorkerSummary,
): Promise<void> {
  if (candidates.length === 0) return
  const startedAt = new Date().toISOString()
  const source = candidates[0]?.source ?? resolveSource(meta)
  await writePipelineState(product.id, meta, candidates, {
    status: 'processing', source, queuedAt: meta.datasheetPipeline?.queuedAt ?? startedAt, startedAt,
  })

  const uploaded: UploadedDatasheet[] = []
  const failed: DatasheetCandidate[] = []
  const errors: string[] = []
  for (const candidate of candidates) {
    try {
      uploaded.push(await processCandidate(candidate, product.partNumber))
    } catch (error: unknown) {
      failed.push(candidate)
      errors.push(error instanceof Error ? error.message : String(error))
    }
  }

  if (uploaded.length === 0) {
    await markFailed(product.id, meta, candidates, source, startedAt, errors)
    summary.failed++
    console.error(`  ${product.partNumber}: ошибка - ${errors.join('; ')}`)
    return
  }

  await saveSuccessfulProduct(
    product,
    meta,
    rows,
    uploaded,
    failed,
    publicBase,
    source,
    startedAt,
    errors,
  )
  summary.uploaded += uploaded.length
  if (failed.length === 0) summary.completed++
  else summary.failed++
  console.log(`  ${product.partNumber}: сохранено PDF - ${uploaded.length}, ошибок - ${failed.length}`)
}

async function processCandidate(
  candidate: DatasheetCandidate,
  partNumber: string,
): Promise<UploadedDatasheet> {
  const { bytes } = await downloadPdfBytes(candidate.url)
  const stored = await uploadObjectBuffer(datasheetStorageKey(bytes), bytes, 'application/pdf')
  return {
    title: candidate.title || `${partNumber} Datasheet`,
    url: stored.url,
    fileSize: `${bytes.length} B`,
    language: candidate.language,
  }
}

async function saveSuccessfulProduct(
  product: ProductRow,
  meta: EnrichmentMeta,
  rows: StoredDatasheet[],
  uploaded: UploadedDatasheet[],
  failed: DatasheetCandidate[],
  publicBase: string,
  source: DataSource,
  startedAt: string,
  errors: string[],
): Promise<void> {
  const managed = rows.filter(({ url }) => isManagedDatasheetUrl(url, publicBase))
  const failedUrls = new Set(failed.map(({ url }) => url))
  const stillReadable = rows.filter(({ url }) => failedUrls.has(url))
  const finalRows = deduplicateRows([...managed, ...uploaded, ...stillReadable])
  const completedAt = new Date().toISOString()
  const nextMeta = buildFinishedMeta(
    meta,
    failed,
    source,
    startedAt,
    completedAt,
    uploaded.length,
    errors,
  )

  await prisma.$transaction([
    prisma.datasheet.deleteMany({ where: { productId: product.id } }),
    prisma.datasheet.createMany({
      data: finalRows.map((row) => ({ ...row, productId: product.id })),
    }),
    prisma.product.update({
      where: { id: product.id },
      data: { enrichmentMeta: nextMeta as unknown as Prisma.InputJsonValue },
    }),
  ])
}

function buildFinishedMeta(
  meta: EnrichmentMeta,
  failed: DatasheetCandidate[],
  source: DataSource,
  startedAt: string,
  completedAt: string,
  uploaded: number,
  errors: string[],
): EnrichmentMeta {
  const next: EnrichmentMeta = { ...meta }
  next.datasheets = { source, fetchedAt: completedAt }
  next.datasheetPipeline = {
    status: failed.length === 0 ? 'complete' : 'failed',
    source,
    queuedAt: meta.datasheetPipeline?.queuedAt ?? completedAt,
    startedAt,
    completedAt,
    uploaded,
    ...(errors.length > 0 ? { error: errors.join('; ').slice(0, 1000) } : {}),
  }
  if (failed.length > 0) next.datasheetCandidates = failed
  else delete next.datasheetCandidates
  return next
}

async function markFailed(
  productId: string,
  meta: EnrichmentMeta,
  candidates: DatasheetCandidate[],
  source: DataSource,
  startedAt: string,
  errors: string[],
): Promise<void> {
  await writePipelineState(productId, meta, candidates, {
    status: 'failed',
    source,
    queuedAt: meta.datasheetPipeline?.queuedAt ?? startedAt,
    startedAt,
    completedAt: new Date().toISOString(),
    uploaded: 0,
    error: errors.join('; ').slice(0, 1000),
  })
}

async function writePipelineState(
  productId: string,
  meta: EnrichmentMeta,
  candidates: DatasheetCandidate[],
  state: NonNullable<EnrichmentMeta['datasheetPipeline']>,
): Promise<void> {
  const next: EnrichmentMeta = { ...meta, datasheetCandidates: candidates, datasheetPipeline: state }
  await prisma.product.update({
    where: { id: productId },
    data: { enrichmentMeta: next as unknown as Prisma.InputJsonValue },
  })
}

function readMeta(value: Prisma.JsonValue | null): EnrichmentMeta {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as unknown as EnrichmentMeta
}

function resolveSource(meta: EnrichmentMeta): DataSource {
  return meta.datasheetPipeline?.source ?? meta.datasheets?.source ?? 'supplier-stub'
}

function isValidCandidate(value: DatasheetCandidate): boolean {
  return typeof value.url === 'string' && typeof value.source === 'string'
    && (value.language === 'ru' || value.language === 'en')
}

function deduplicateRows(rows: StoredDatasheet[]): StoredDatasheet[] {
  const seen = new Set<string>()
  return rows.filter(({ url }) => {
    if (seen.has(url)) return false
    seen.add(url)
    return true
  })
}
