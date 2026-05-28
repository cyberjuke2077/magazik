/**
 * Backfill existing ProductImage rows from upstream CDN URLs to R2.
 *
 * Walks ProductImage rows whose imageUrl points at an upstream CDN
 * (LCSC, Mouser, ChipDip), pulls each image, transcodes to WebP, and
 * uploads to R2. Updates imageUrl in place to the R2 public URL.
 *
 * Idempotent — uploadProductImage HEADs the key first, so reruns are
 * cheap. Safe to interrupt and resume.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-images-to-r2.ts --dry-run
 *   pnpm tsx scripts/backfill-images-to-r2.ts --limit 100
 *   pnpm tsx scripts/backfill-images-to-r2.ts --concurrency 4
 */

import { isR2Configured, uploadProductImage } from '../src/lib/storage/r2-client'
import { prisma } from '../src/lib/prisma'

interface CliArgs {
  limit: number
  concurrency: number
  dryRun: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { limit: Infinity, concurrency: 4, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--limit') {
      const v = parseInt(argv[++i] ?? '', 10)
      if (!isNaN(v) && v > 0) args.limit = v
    } else if (a === '--concurrency') {
      const v = parseInt(argv[++i] ?? '', 10)
      if (!isNaN(v) && v > 0) args.concurrency = v
    } else if (a === '--dry-run') {
      args.dryRun = true
    } else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: tsx scripts/backfill-images-to-r2.ts [--limit N] [--concurrency N] [--dry-run]',
      )
      process.exit(0)
    }
  }
  return args
}

const UPSTREAM_HOST_RE = /(?:lcsc\.com|mouser\.com|chipdip\.ru)$/i

function isUpstream(host: string): boolean {
  return UPSTREAM_HOST_RE.test(host)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!isR2Configured()) {
    console.error(
      'R2 not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL in .env.local',
    )
    process.exit(1)
  }

  console.log(`Image backfill → R2`)
  console.log(`  limit:       ${args.limit === Infinity ? 'all' : args.limit}`)
  console.log(`  concurrency: ${args.concurrency}`)
  console.log(`  dryRun:      ${args.dryRun}`)
  console.log('')

  const rows = await prisma.productImage.findMany({
    select: { id: true, imageUrl: true },
    orderBy: { id: 'asc' },
  })

  const targets = rows.filter((r) => {
    try {
      return isUpstream(new URL(r.imageUrl).hostname)
    } catch {
      return false
    }
  })

  const work = targets.slice(0, args.limit === Infinity ? targets.length : args.limit)

  console.log(`Total ProductImage rows: ${rows.length}`)
  console.log(`Pointing at upstream CDN: ${targets.length}`)
  console.log(`Will process: ${work.length}`)
  console.log('')

  if (args.dryRun || work.length === 0) {
    for (const r of work.slice(0, 10)) console.log(`  ${r.imageUrl}`)
    if (work.length > 10) console.log(`  ... and ${work.length - 10} more`)
    await prisma.$disconnect()
    return
  }

  let uploaded = 0
  let skipped = 0
  let failed = 0
  const startedAt = Date.now()

  for (let i = 0; i < work.length; i += args.concurrency) {
    const slice = work.slice(i, i + args.concurrency)
    await Promise.all(
      slice.map(async (row) => {
        try {
          const result = await uploadProductImage(row.imageUrl)
          await prisma.productImage.update({
            where: { id: row.id },
            data: { imageUrl: result.url },
          })
          if (result.alreadyExisted) skipped++
          else uploaded++
          const idx = i + slice.indexOf(row) + 1
          const tag = result.alreadyExisted ? 'exists' : `${(result.bytes / 1024).toFixed(0)}KB`
          console.log(`  [${idx}/${work.length}] ${tag.padEnd(8)} ${row.imageUrl}`)
        } catch (err) {
          failed++
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(`  [${i + 1}/${work.length}] FAIL    ${row.imageUrl}: ${msg}`)
        }
      }),
    )
  }

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log('')
  console.log(`Summary`)
  console.log(`  uploaded: ${uploaded}`)
  console.log(`  skipped:  ${skipped}  (already in R2)`)
  console.log(`  failed:   ${failed}`)
  console.log(`  elapsed:  ${elapsedSec}s`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
