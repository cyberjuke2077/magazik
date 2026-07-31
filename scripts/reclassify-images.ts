/**
 * Бэкфилл изображений и корпусов для уже импортированных товаров.
 *
 * Приводит существующие данные в соответствие с новой автономной логикой
 * (см. src/lib/enrichment/images/*):
 *
 *   ИЗОБРАЖЕНИЯ
 *     Скачивает каждый ProductImage, классифицирует (clean/watermark+junk).
 *     watermark/junk-строки УДАЛЯЮТСЯ из БД — у товара остаются только
 *     чистые фото; если чистых не осталось, товар на фронте показывает
 *     generic-SVG корпуса. Дополнительно удаляются junk-дубли
 *     (один и тот же контент у >= JUNK_MIN_DUPES товаров — LCSC «нет фото»).
 *
 *   PACKAGE
 *     Где product.package пуст — извлекает семейство из partNumber/name
 *     и записывает его (для каталога и generic-картинки).
 *
 * Идемпотентно: clean-фото не трогаются, package перезаписывается только
 * если пуст. Безопасный предпросмотр через --dry-run.
 *
 * Заменяет прежний scripts/clean-images.ts (тот пытался «отмыть» watermark
 * кропом, что роняло качество и не убирало знак).
 *
 * Usage:
 *   npm exec tsx -- scripts/reclassify-images.ts [--dry-run] [--limit N]
 */
import './_load-env'

import { prisma } from '../src/lib/prisma'
import {
  classifyImage,
  contentHash,
} from '../src/lib/enrichment/images/image-classifier'
import { extractPackageFamily } from '../src/lib/enrichment/images/package-extractor'

/** Контент, встречающийся у скольки разных товаров считаем junk-заглушкой. */
const JUNK_MIN_DUPES = 3
const FETCH_CONCURRENCY = 6

function parseArgs(): { dryRun: boolean; limit: number | null } {
  const args = process.argv.slice(2)
  let dryRun = false
  let limit: number | null = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') dryRun = true
    else if (args[i] === '--limit' && args[i + 1]) limit = Number.parseInt(args[++i]!, 10)
  }
  return { dryRun, limit }
}

interface ImgRow {
  id: string
  imageUrl: string
  productId: string
}

async function classifyAll(
  rows: ImgRow[],
): Promise<Map<string, { verdict: 'clean' | 'watermark'; hash: string } | null>> {
  const out = new Map<string, { verdict: 'clean' | 'watermark'; hash: string } | null>()
  for (let i = 0; i < rows.length; i += FETCH_CONCURRENCY) {
    const slice = rows.slice(i, i + FETCH_CONCURRENCY)
    await Promise.all(
      slice.map(async (r) => {
        try {
          const resp = await fetch(r.imageUrl)
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const buf = Buffer.from(await resp.arrayBuffer())
          const { verdict } = await classifyImage(buf)
          out.set(r.id, { verdict, hash: contentHash(buf) })
        } catch (err) {
          console.warn(`  fetch fail ${r.imageUrl}: ${err instanceof Error ? err.message : err}`)
          out.set(r.id, null) // неизвестно — оставим как есть
        }
      }),
    )
    process.stdout.write(`\r  classified ${Math.min(i + FETCH_CONCURRENCY, rows.length)}/${rows.length}`)
  }
  process.stdout.write('\n')
  return out
}

async function backfillImages(dryRun: boolean, limit: number | null): Promise<void> {
  console.log('\n── Images ──')
  const rows: ImgRow[] = await prisma.productImage.findMany({
    select: { id: true, imageUrl: true, productId: true },
    ...(limit !== null && { take: limit }),
  })
  console.log(`  total ProductImage: ${rows.length}`)

  const verdicts = await classifyAll(rows)

  // junk-дубли по контенту
  const hashOwners = new Map<string, Set<string>>()
  for (const r of rows) {
    const v = verdicts.get(r.id)
    if (!v) continue
    let set = hashOwners.get(v.hash)
    if (!set) { set = new Set(); hashOwners.set(v.hash, set) }
    set.add(r.productId)
  }
  const junkHashes = new Set(
    [...hashOwners.entries()].filter(([, owners]) => owners.size >= JUNK_MIN_DUPES).map(([h]) => h),
  )
  if (junkHashes.size) console.log(`  junk dup hashes: ${junkHashes.size}`)

  const toDelete: string[] = []
  for (const r of rows) {
    const v = verdicts.get(r.id)
    if (!v) continue // не смогли скачать — не трогаем
    if (v.verdict !== 'clean' || junkHashes.has(v.hash)) toDelete.push(r.id)
  }

  const kept = rows.length - toDelete.length
  console.log(`  keep clean: ${kept}`)
  console.log(`  delete watermark/junk: ${toDelete.length}`)

  if (!dryRun && toDelete.length) {
    // батчами, чтобы не упереться в лимит параметров
    for (let i = 0; i < toDelete.length; i += 500) {
      const batch = toDelete.slice(i, i + 500)
      await prisma.productImage.deleteMany({ where: { id: { in: batch } } })
    }
    console.log(`  ✓ deleted ${toDelete.length} rows`)
  }
}

async function backfillPackages(dryRun: boolean): Promise<void> {
  console.log('\n── Packages ──')
  const products = await prisma.product.findMany({
    where: { package: null },
    select: { id: true, partNumber: true, name: true },
  })
  console.log(`  products without package: ${products.length}`)

  const updates: Array<{ id: string; pkg: string }> = []
  for (const p of products) {
    const fam = extractPackageFamily(null, p.partNumber, p.name)
    if (fam) updates.push({ id: p.id, pkg: fam })
  }
  console.log(`  resolvable from MPN/name: ${updates.length}`)

  if (!dryRun && updates.length) {
    for (const u of updates) {
      await prisma.product.update({ where: { id: u.id }, data: { package: u.pkg } })
    }
    console.log(`  ✓ updated ${updates.length} products`)
  }
}

async function main(): Promise<void> {
  const { dryRun, limit } = parseArgs()
  if (dryRun) console.log('DRY RUN — no DB writes')

  await backfillImages(dryRun, limit)
  await backfillPackages(dryRun)

  console.log('\nDone.')
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
