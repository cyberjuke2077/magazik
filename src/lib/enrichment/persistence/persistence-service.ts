/**
 * Persistence Service Module
 *
 * Batch upserts enrichment results into the database using Prisma transactions.
 * Handles: Manufacturer, Category, Product, Specifications, Datasheets, ProductImages.
 * Applies provenance merge rules to avoid overwriting stronger sources.
 */

import { type Prisma } from '@prisma/client'

import { prisma } from '../../prisma'
import { isR2Configured, uploadProductImage } from '../../storage/r2-client'
import {
  type DataSource,
  type EnrichmentMeta,
  type EnrichmentResult,
  type FieldProvenance,
  type PartIdentity,
} from '../types'
import { shouldOverwrite } from './provenance-merger'
import { generateSlug } from './slug-generator'

type JsonValue = Prisma.InputJsonValue

export interface PersistBatchResult {
  persisted: number
  failed: number
  errors: Array<{ mpn: string; error: string }>
}

/**
 * Determines enrichment status based on available fields.
 * - 'complete': has name + description + specs
 * - 'partial': has some fields but not all three
 * - 'unresolved': no result at all
 */
function determineEnrichmentStatus(result: EnrichmentResult | null): string {
  if (!result) return 'unresolved'

  const hasName = !!result.name
  const hasDescription = !!result.description
  const hasSpecs = !!result.specs && result.specs.length > 0

  if (hasName && hasDescription && hasSpecs) return 'complete'
  if (hasName || hasDescription || hasSpecs) return 'partial'
  return 'unresolved'
}

/**
 * Generates a manufacturer slug from a brand name.
 * Lowercase, replace non-alphanumeric with dashes, collapse, trim.
 */
function manufacturerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Generates a category slug from a category name.
 * Basic transliteration for Russian chars, then kebab-case.
 */
function categorySlug(name: string): string {
  const translitMap: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
    ж: 'zh', з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }

  const transliterated = name
    .toLowerCase()
    .split('')
    .map((ch) => translitMap[ch] ?? ch)
    .join('')

  return transliterated
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Builds provenance metadata for a field.
 */
function buildProvenance(source: DataSource): FieldProvenance {
  return {
    source,
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Persists a batch of enrichment results into the database.
 * Uses a single Prisma transaction for the entire batch.
 *
 * For each item:
 * 1. Upserts Manufacturer by slug
 * 2. Resolves Category (upsert or use uncategorized)
 * 3. Upserts Product by (manufacturerId, mpnNormalized)
 * 4. Applies provenance merge before writing fields
 * 5. Replaces Specifications if provenance allows
 * 6. Replaces Datasheets with language based on source
 * 7. Replaces ProductImages (LCSC/Mouser only, max 10)
 *
 * @param items - Array of identity + result pairs to persist
 * @returns Summary of persisted/failed counts and errors
 */
export async function persistBatch(
  items: Array<{ identity: PartIdentity; result: EnrichmentResult | null }>,
): Promise<PersistBatchResult> {
  const errors: Array<{ mpn: string; error: string }> = []
  let persisted = 0
  let failed = 0

  // Pre-transaction: upload images to R2 outside the DB transaction.
  // Network I/O inside a Prisma transaction holds row locks for the
  // entire fetch+transcode duration — guaranteed deadlocks at scale.
  // Mutates each item's result.imageUrls in-place to the R2 public URLs.
  await mirrorImagesToStorage(items)

  try {
    await prisma.$transaction(async (tx) => {
      for (const { identity, result } of items) {
        try {
          await persistItem(tx, identity, result)
          persisted++
        } catch (err) {
          failed++
          errors.push({
            mpn: identity.canonicalMpn,
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    })
  } catch (err) {
    // Transaction-level failure — all items failed
    const txError = err instanceof Error ? err.message : String(err)
    for (const { identity } of items) {
      if (!errors.find((e) => e.mpn === identity.canonicalMpn)) {
        errors.push({ mpn: identity.canonicalMpn, error: txError })
      }
    }
    failed = items.length
    persisted = 0
  }

  return { persisted, failed, errors }
}

/**
 * Persists a single item within a transaction context.
 */
async function persistItem(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  identity: PartIdentity,
  result: EnrichmentResult | null,
): Promise<void> {
  const source: DataSource = result?.source ?? 'supplier-stub'
  const now = new Date()

  // 1. Upsert Manufacturer
  const mfgSlug = manufacturerSlug(identity.canonicalBrand)
  const manufacturer = await tx.manufacturer.upsert({
    where: { slug: mfgSlug },
    create: {
      name: identity.canonicalBrand,
      slug: mfgSlug,
    },
    update: {},
  })

  // 2. Resolve Category
  const categoryId = await resolveCategory(tx, result, source)

  // 3. Upsert Product
  const slug = generateSlug(identity.canonicalBrand, identity.canonicalMpn)
  const enrichmentStatus = determineEnrichmentStatus(result)

  // Check existing product for provenance merge
  const existingProduct = await tx.product.findUnique({
    where: {
      manufacturer_mpn_normalized: {
        manufacturerId: manufacturer.id,
        mpnNormalized: identity.canonicalMpn,
      },
    },
    select: { id: true, enrichmentMeta: true, slug: true },
  })

  const existingMeta = existingProduct?.enrichmentMeta as EnrichmentMeta | null

  // Build new enrichment meta
  const newMeta: EnrichmentMeta = { ...(existingMeta ?? {}) }

  // Determine field values with provenance checks
  const productName = result?.name ?? `${identity.canonicalBrand} ${identity.originalMpn}`
  const productDescription = result?.description ?? (result ? undefined : 'Нет данных')

  // Apply provenance for name
  const writeName = shouldOverwrite(existingMeta, 'name', source)
  if (writeName) {
    newMeta.name = buildProvenance(source)
  }

  // Apply provenance for description
  const writeDescription = shouldOverwrite(existingMeta, 'description', source)
  if (writeDescription && productDescription !== undefined) {
    newMeta.description = buildProvenance(source)
    if (result?.descriptionLanguage) {
      newMeta.descriptionLanguage = result.descriptionLanguage
    }
  }

  // Apply provenance for category
  const writeCategory = shouldOverwrite(existingMeta, 'category', source)
  if (writeCategory) {
    newMeta.category = buildProvenance(source)
  }

  // Build upsert data
  const productData = {
    slug,
    name: writeName ? productName : undefined,
    partNumber: identity.originalMpn,
    mpnNormalized: identity.canonicalMpn,
    enrichmentStatus,
    enrichmentMeta: newMeta as unknown as JsonValue,
    lastEnrichedAt: now,
    ...(writeCategory ? { categoryId } : {}),
    ...(result?.lifecycle ? { lifecycle: result.lifecycle } : {}),
    ...(result?.package ? { package: result.package } : {}),
    ...(writeDescription && productDescription !== undefined
      ? { description: productDescription }
      : {}),
  }

  // Use existing slug if product already exists (slug is unique, avoid conflicts)
  const upsertSlug = existingProduct?.slug ?? slug

  const product = await tx.product.upsert({
    where: {
      manufacturer_mpn_normalized: {
        manufacturerId: manufacturer.id,
        mpnNormalized: identity.canonicalMpn,
      },
    },
    create: {
      ...productData,
      slug: upsertSlug,
      name: productName,
      partNumber: identity.originalMpn,
      description: productDescription ?? 'Нет данных',
      categoryId,
      manufacturerId: manufacturer.id,
      mpnNormalized: identity.canonicalMpn,
      enrichmentStatus,
      enrichmentMeta: newMeta as unknown as JsonValue,
      lastEnrichedAt: now,
      ...(result?.lifecycle ? { lifecycle: result.lifecycle } : {}),
      ...(result?.package ? { package: result.package } : {}),
    },
    update: {
      ...(writeName ? { name: productName } : {}),
      ...(writeDescription && productDescription !== undefined
        ? { description: productDescription }
        : {}),
      ...(writeCategory ? { categoryId } : {}),
      ...(result?.lifecycle ? { lifecycle: result.lifecycle } : {}),
      ...(result?.package ? { package: result.package } : {}),
      enrichmentStatus,
      enrichmentMeta: newMeta as unknown as JsonValue,
      lastEnrichedAt: now,
    },
  })

  // 5. Replace Specifications (if result has specs AND provenance allows)
  if (result?.specs && result.specs.length > 0 && shouldOverwrite(existingMeta, 'specs', source)) {
    await tx.specification.deleteMany({ where: { productId: product.id } })
    await tx.specification.createMany({
      data: result.specs.map((spec, idx) => ({
        productId: product.id,
        key: spec.key,
        value: spec.value,
        order: idx,
      })),
    })
    newMeta.specs = buildProvenance(source)
    await tx.product.update({
      where: { id: product.id },
      data: { enrichmentMeta: newMeta as unknown as JsonValue },
    })
  }

  // 6. Replace Datasheets (if result has datasheets AND provenance allows)
  if (
    result?.datasheetUrls &&
    result.datasheetUrls.length > 0 &&
    shouldOverwrite(existingMeta, 'datasheets', source)
  ) {
    const language = source === 'chipdip' ? 'ru' : 'en'
    await tx.datasheet.deleteMany({ where: { productId: product.id } })
    await tx.datasheet.createMany({
      data: result.datasheetUrls.map((url) => ({
        productId: product.id,
        title: `${identity.canonicalMpn} Datasheet`,
        url,
        language,
      })),
    })
    newMeta.datasheets = buildProvenance(source)
    await tx.product.update({
      where: { id: product.id },
      data: { enrichmentMeta: newMeta as unknown as JsonValue },
    })
  }

  // 7. Replace ProductImages (LCSC/Mouser only, max 10, ordered)
  if (
    result?.imageUrls &&
    result.imageUrls.length > 0 &&
    (source === 'lcsc' || source === 'mouser') &&
    shouldOverwrite(existingMeta, 'images', source)
  ) {
    const imagesToSave = result.imageUrls.slice(0, 10)
    await tx.productImage.deleteMany({ where: { productId: product.id } })
    await tx.productImage.createMany({
      data: imagesToSave.map((url, idx) => ({
        productId: product.id,
        imageUrl: url,
        order: idx,
      })),
    })
    newMeta.images = buildProvenance(source)
    await tx.product.update({
      where: { id: product.id },
      data: { enrichmentMeta: newMeta as unknown as JsonValue },
    })
  }
}

/**
 * Resolves the category ID for a product based on the enrichment result.
 * - ChipDip: upsert with Russian name, slug from transliteration
 * - LCSC/Mouser: upsert with English name, nameNeedsReview = true
 * - No category: use seed "uncategorized" category
 */
async function resolveCategory(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  result: EnrichmentResult | null,
  source: DataSource,
): Promise<string> {
  if (!result?.categoryName) {
    // Use uncategorized seed category
    const uncategorized = await tx.category.findUnique({
      where: { slug: 'uncategorized' },
    })
    if (!uncategorized) {
      // Create it if it doesn't exist (safety fallback)
      const created = await tx.category.create({
        data: { slug: 'uncategorized', name: 'Без категории' },
      })
      return created.id
    }
    return uncategorized.id
  }

  const slug = categorySlug(result.categoryName)

  if (source === 'chipdip') {
    // Russian name, slug from transliteration
    const category = await tx.category.upsert({
      where: { slug },
      create: {
        slug,
        name: result.categoryName,
        nameNeedsReview: false,
      },
      update: {},
    })
    return category.id
  }

  // LCSC or Mouser: English name, needs review
  const category = await tx.category.upsert({
    where: { slug },
    create: {
      slug,
      name: result.categoryName,
      nameNeedsReview: true,
    },
    update: {},
  })
  return category.id
}

const MAX_IMAGES_PER_PRODUCT = 10
const IMAGE_UPLOAD_CONCURRENCY = 4

/**
 * Mirror upstream image URLs (LCSC/Mouser) into R2 BEFORE the persist
 * transaction. Mutates each item.result.imageUrls in place so the
 * downstream `persistItem` writes R2 public URLs instead of upstream
 * CDN links — independence from upstream CDN availability + ToS.
 *
 * No-op when R2 is not configured; upstream URLs flow through unchanged
 * so dev environments without credentials still work.
 *
 * Errors per-image are swallowed (logged) so a single 404 from LCSC
 * doesn't tank an entire enrichment batch — we keep the URLs we got.
 */
async function mirrorImagesToStorage(
  items: Array<{ identity: PartIdentity; result: EnrichmentResult | null }>,
): Promise<void> {
  if (!isR2Configured()) return

  const tasks: Array<{
    item: { identity: PartIdentity; result: EnrichmentResult | null }
    sourceUrl: string
    sourceIdx: number
  }> = []

  for (const item of items) {
    const r = item.result
    if (!r?.imageUrls?.length) continue
    if (r.source !== 'lcsc' && r.source !== 'mouser') continue
    const urls = r.imageUrls.slice(0, MAX_IMAGES_PER_PRODUCT)
    urls.forEach((url, idx) => tasks.push({ item, sourceUrl: url, sourceIdx: idx }))
  }

  if (tasks.length === 0) return

  const mirroredByItem = new Map<typeof items[number], Map<number, string>>()

  for (let i = 0; i < tasks.length; i += IMAGE_UPLOAD_CONCURRENCY) {
    const slice = tasks.slice(i, i + IMAGE_UPLOAD_CONCURRENCY)
    await Promise.all(
      slice.map(async ({ item, sourceUrl, sourceIdx }) => {
        try {
          const uploaded = await uploadProductImage(sourceUrl)
          let bucket = mirroredByItem.get(item)
          if (!bucket) {
            bucket = new Map()
            mirroredByItem.set(item, bucket)
          }
          bucket.set(sourceIdx, uploaded.url)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(
            `[persistence] R2 upload failed for ${item.identity.canonicalMpn} (${sourceUrl}): ${msg}`,
          )
        }
      }),
    )
  }

  for (const [item, mapping] of mirroredByItem) {
    if (!item.result?.imageUrls) continue
    item.result.imageUrls = item.result.imageUrls.map(
      (url, idx) => mapping.get(idx) ?? url,
    )
  }
}
