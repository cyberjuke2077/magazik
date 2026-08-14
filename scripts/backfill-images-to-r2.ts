/**
 * Audit existing ProductImage rows that still point to upstream CDNs.
 *
 * Walks ProductImage rows whose imageUrl points at an upstream CDN
 * Direct upload is disabled: every candidate must pass the local
 * Florence-2 + LaMa worker before it can enter R2.
 *
 * Usage:
 *   npm exec tsx -- scripts/backfill-images-to-r2.ts --dry-run
 *   npm exec tsx -- scripts/backfill-images-to-r2.ts --limit 100
 *   npm exec tsx -- scripts/backfill-images-to-r2.ts --concurrency 4
 */

import './_load-env'
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

  console.log('Image backfill audit')
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

  for (const r of work.slice(0, 10)) console.log(`  ${r.imageUrl}`)
  if (work.length > 10) console.log(`  ... and ${work.length - 10} more`)
  await prisma.$disconnect()

  if (!args.dryRun && work.length > 0) {
    throw new Error(
      'Direct upstream-to-R2 backfill is disabled. Queue candidates and run tools/watermark-removal/process_catalog_images.py.',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
