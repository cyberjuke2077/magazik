/**
 * Re-enrichment script for unresolved/pending products via LCSC.
 *
 * Picks Product rows with enrichmentStatus filtered by --status
 * (default: unresolved,pending), runs them through the rewritten LCSC
 * CloakBrowser+JSON-LD client, and persists results via persistBatch().
 *
 * Usage:
 *   pnpm enrichment:reenrich --limit 50
 *   pnpm enrichment:reenrich --status unresolved --limit 100
 *   pnpm enrichment:reenrich --dry-run
 *
 * Why: ~27% of products are stuck in unresolved/pending. The rewritten
 * lcsc-client (JSON-LD parse instead of brittle SPA DOM scrape) recovers
 * most of these — confirmed at ~100% hit rate on Analog Devices smoke test.
 */

import './_load-env'
import { createLcscClient } from '../src/lib/enrichment/sources/lcsc-client'
import { persistBatch } from '../src/lib/enrichment/persistence/persistence-service'
import {
  type EnrichmentResult,
  type PartIdentity,
} from '../src/lib/enrichment/types'
import { prisma } from '../src/lib/prisma'

interface CliArgs {
  limit: number
  statuses: string[]
  dryRun: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    limit: 100,
    statuses: ['unresolved', 'pending'],
    dryRun: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--limit') {
      const v = parseInt(argv[++i] ?? '', 10)
      if (!isNaN(v) && v > 0) args.limit = v
    } else if (a === '--status') {
      const v = argv[++i] ?? ''
      args.statuses = v.split(',').map((s) => s.trim()).filter(Boolean)
    } else if (a === '--dry-run') {
      args.dryRun = true
    } else if (a === '--help' || a === '-h') {
      console.log(
        'Usage: tsx scripts/reenrich-unresolved.ts [--limit N] [--status A,B] [--dry-run]',
      )
      process.exit(0)
    }
  }
  return args
}

const PERSIST_BATCH_SIZE = 5

async function main() {
  const args = parseArgs(process.argv.slice(2))

  console.log(`Re-enrichment via LCSC`)
  console.log(`  status:  ${args.statuses.join(', ')}`)
  console.log(`  limit:   ${args.limit}`)
  console.log(`  dryRun:  ${args.dryRun}`)
  console.log('')

  const candidates = await prisma.product.findMany({
    where: { enrichmentStatus: { in: args.statuses } },
    select: {
      id: true,
      partNumber: true,
      mpnNormalized: true,
      manufacturer: { select: { name: true } },
    },
    orderBy: { lastEnrichedAt: 'asc' },
    take: args.limit,
  })

  console.log(`Found ${candidates.length} candidates`)
  if (candidates.length === 0) {
    await prisma.$disconnect()
    return
  }

  if (args.dryRun) {
    for (const c of candidates.slice(0, 20)) {
      console.log(
        `  ${c.manufacturer.name.padEnd(20)} ${c.mpnNormalized ?? c.partNumber}`,
      )
    }
    if (candidates.length > 20) {
      console.log(`  ... and ${candidates.length - 20} more`)
    }
    await prisma.$disconnect()
    return
  }

  const client = await createLcscClient()
  const buffer: Array<{ identity: PartIdentity; result: EnrichmentResult | null }> = []

  let found = 0
  let notFound = 0
  let errored = 0
  let blocked = false
  let consecutiveNotFound = 0
  const CONSECUTIVE_MISS_BREAK = 8

  try {
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i]
      const mpn = c.mpnNormalized || c.partNumber
      const brand = c.manufacturer.name

      if (!mpn) {
        notFound++
        continue
      }

      const startMs = Date.now()
      let result: EnrichmentResult | null = null
      try {
        result = await client.searchMpn(mpn, brand)
      } catch (err) {
        errored++
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`  [${i + 1}/${candidates.length}] ${mpn}: error: ${msg}`)
        continue
      }
      const durationMs = Date.now() - startMs

      if (result) {
        found++
        consecutiveNotFound = 0
        const identity: PartIdentity = {
          canonicalBrand: brand,
          canonicalMpn: mpn,
          originalBrand: brand,
          originalMpn: c.partNumber,
          packages: [],
          dateCodes: [],
        }
        buffer.push({ identity, result })
        console.log(
          `  [${i + 1}/${candidates.length}] ${mpn} → found (${durationMs}ms, specs=${result.specs?.length ?? 0}, imgs=${result.imageUrls?.length ?? 0})`,
        )
      } else {
        notFound++
        consecutiveNotFound++
        console.log(`  [${i + 1}/${candidates.length}] ${mpn} → not found (${durationMs}ms)`)
      }

      // Authoritative block signal from the client (403/429 in-session)
      if (client.isBlocked()) {
        console.warn(`\n⚠️  Client reports blocked state (HTTP 403/429). Stopping early.`)
        blocked = true
        break
      }

      // Heuristic: many consecutive misses likely means soft-block or network issue
      if (consecutiveNotFound >= CONSECUTIVE_MISS_BREAK) {
        console.warn(
          `\n⚠️  ${CONSECUTIVE_MISS_BREAK} consecutive misses — likely soft-block. Stopping early.`,
        )
        blocked = true
        break
      }

      if (buffer.length >= PERSIST_BATCH_SIZE) {
        await flush(buffer)
      }
    }

    if (buffer.length > 0) await flush(buffer)
  } finally {
    await client.close()
    await prisma.$disconnect()
  }

  console.log('')
  console.log(`Summary`)
  console.log(`  found:    ${found}`)
  console.log(`  notFound: ${notFound}`)
  console.log(`  errored:  ${errored}`)
  console.log(`  blocked:  ${blocked}`)
  console.log(`  persisted to DB: ${found - errored}`)
}

async function flush(
  buffer: Array<{ identity: PartIdentity; result: EnrichmentResult | null }>,
): Promise<void> {
  const items = buffer.splice(0, buffer.length)
  if (items.length === 0) return
  const res = await persistBatch(items)
  if (res.failed > 0) {
    console.warn(`  flush: ${res.failed}/${items.length} failed`)
    for (const e of res.errors.slice(0, 3)) {
      console.warn(`    ${e.mpn}: ${e.error}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
