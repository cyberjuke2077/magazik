/**
 * Enrichment Pipeline Status CLI
 *
 * Displays current progress and breakdown of the enrichment pipeline.
 *
 * Usage:
 *   npm run enrichment:status -- [options]
 *
 * Options:
 *   --watch              Live TUI watcher (polls DB every 2s)
 *   --brand <name>       Detailed report for a specific brand
 *   --unresolved         List unresolved MPN
 *   --json               Output as JSON (only with --unresolved)
 *   --source-stats       Hit rate and duration stats per source
 *   --period FROM..TO    Filter --source-stats by date range
 */

import 'dotenv/config'

import { prisma } from '../lib/prisma'
import {
  parseStatusArgs,
  CliUsageError,
} from '../lib/enrichment/observability/cli-args'
import { loadDashboardSnapshot } from '../lib/enrichment/observability/db-poller'
import { loadCoverage } from '../lib/enrichment/observability/coverage-probe'
import {
  computeHitRate,
  computeSourcesPercent,
} from '../lib/enrichment/observability/metrics'

async function main(): Promise<void> {
  let flags
  try {
    flags = parseStatusArgs(process.argv.slice(2))
  } catch (err) {
    if (err instanceof CliUsageError) {
      console.error(`Ошибка: ${err.message}`)
      process.exit(1)
    }
    throw err
  }

  if (flags.watch) {
    await runWatchMode(flags)
    return
  }
  if (flags.brand) {
    await runBrandReport(flags.brand)
    return
  }
  if (flags.unresolved) {
    await runUnresolvedReport(flags.json)
    return
  }
  if (flags.sourceStats) {
    await runSourceStatsReport()
    return
  }

  // Default: snapshot
  const snapshot = await loadDashboardSnapshot()
  const coverage = await loadCoverage()

  console.log('=== Enrichment Status ===')
  console.log(`Run: ${snapshot.runId ?? 'нет активного'}`)
  console.log(`Phase: ${snapshot.phase}`)
  console.log(
    `Прогресс: ${snapshot.processedInQueue} / ${snapshot.totalInQueue}`,
  )
  console.log(
    `Осталось из Excel: ${snapshot.excelRemaining} / ${snapshot.excelTotal}`,
  )
  console.log(
    `Mouser: ${snapshot.mouserQuota.used} / ${snapshot.mouserQuota.limit}`,
  )
  console.log()
  console.log('--- Статусы ---')
  for (const [status, count] of Object.entries(snapshot.statusCounts)) {
    if (count && count > 0) console.log(`  ${status}: ${count}`)
  }
  console.log()
  console.log('--- Топ-10 брендов ---')
  for (const b of snapshot.brandStats) {
    console.log(`  ${b.brand}: done ${b.done} / rem ${b.remaining}`)
  }
  if (coverage) {
    console.log()
    console.log('--- Coverage ---')
    const pct = (n: number) =>
      Math.round((n / coverage.totalEnriched) * 100)
    console.log(`  description: ${pct(coverage.withDescription)}%`)
    console.log(`  specs: ${pct(coverage.withSpecs)}%`)
    console.log(`  datasheet: ${pct(coverage.withDatasheet)}%`)
    console.log(`  category: ${pct(coverage.withCategory)}%`)
  }
  console.log()
  console.log('--- Последние события ---')
  for (const e of snapshot.recentEvents.slice(0, 10)) {
    const icon = e.status.endsWith('_done')
      ? '✓'
      : e.status.endsWith('_blocked')
        ? '⚠'
        : '✗'
    console.log(`  ${icon} ${e.mpn}  ${e.brand}  ${e.status}`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runWatchMode(_flags: { brand: string | null }) {
  const { createDashboardState } = await import(
    '../lib/enrichment/observability/dashboard-state'
  )
  const { startDbPoller } = await import(
    '../lib/enrichment/observability/db-poller'
  )
  const { startCoverageProbe } = await import(
    '../lib/enrichment/observability/coverage-probe'
  )

  const stateApi = createDashboardState()
  startDbPoller(stateApi, { intervalMs: 2000 })
  startCoverageProbe(stateApi, { intervalMs: 30_000 })

  try {
    const { render } = await import('ink')
    const React = await import('react')
    const { App } = await import('../components/enrichment-tui')
    render(React.createElement(App, { mode: 'watch' as const, stateApi }))
  } catch {
    // Fallback: текстовый polling каждые 5 секунд
    console.log('TUI недоступен, используем текстовый режим (Ctrl+C для выхода)')
    console.log()
    const poll = async () => {
      const snap = await loadDashboardSnapshot()
      const cov = await loadCoverage()
      console.clear()
      console.log('=== Enrichment Watch (обновление каждые 5с) ===')
      console.log(`Run: ${snap.runId ?? 'нет активного'}  Phase: ${snap.phase}`)
      console.log(`Прогресс: ${snap.processedInQueue} / ${snap.totalInQueue}`)
      console.log(`Осталось из Excel: ${snap.excelRemaining} / ${snap.excelTotal}`)
      console.log(`Mouser: ${snap.mouserQuota.used} / ${snap.mouserQuota.limit}`)
      console.log()
      for (const [s, c] of Object.entries(snap.statusCounts)) {
        if (c && c > 0) console.log(`  ${s}: ${c}`)
      }
      if (cov) {
        const pct = (n: number) => Math.round((n / cov.totalEnriched) * 100)
        console.log()
        console.log(`Coverage: desc ${pct(cov.withDescription)}% | specs ${pct(cov.withSpecs)}% | ds ${pct(cov.withDatasheet)}% | cat ${pct(cov.withCategory)}%`)
      }
      console.log()
      for (const e of snap.recentEvents.slice(0, 10)) {
        const icon = e.status.endsWith('_done') ? '✓' : e.status.endsWith('_blocked') ? '⚠' : '✗'
        console.log(`  ${icon} ${e.mpn}  ${e.brand}  ${e.status}`)
      }
    }
    await poll()
    setInterval(() => void poll(), 5000)
    // Keep process alive
    await new Promise(() => {})
  }
}

async function runBrandReport(brand: string) {
  const mfr = await prisma.manufacturer.findFirst({
    where: { name: { equals: brand, mode: 'insensitive' } },
  })
  if (!mfr) {
    console.error(`Бренд не найден: ${brand}`)
    process.exit(1)
  }

  const groups = await prisma.enrichmentJournal.groupBy({
    by: ['status'],
    _count: { _all: true },
    where: { canonicalBrand: mfr.name },
  })

  console.log(`=== Бренд: ${mfr.name} ===`)
  let total = 0
  for (const g of groups) {
    console.log(`  ${g.status}: ${g._count._all}`)
    total += g._count._all
  }
  console.log(`  Всего: ${total}`)

  // Last 10 errors
  const errors = await prisma.enrichmentJournal.findMany({
    where: {
      canonicalBrand: mfr.name,
      status: {
        in: [
          'chipdip_blocked',
          'lcsc_blocked',
          'mouser_failed',
          'chipdip_not_found',
          'lcsc_not_found',
          'mouser_not_found',
        ],
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  })
  if (errors.length > 0) {
    console.log()
    console.log('--- Последние ошибки ---')
    for (const e of errors) {
      console.log(
        `  ${e.canonicalMpn}  ${e.status}  ` +
          `${e.updatedAt.toISOString()}  ${e.errorMessage ?? ''}`,
      )
    }
  }
}

async function runUnresolvedReport(json: boolean) {
  const items = await prisma.enrichmentJournal.findMany({
    where: { status: 'unresolved' },
    orderBy: { updatedAt: 'desc' },
    ...(json ? {} : { take: 100 }),
    select: {
      canonicalMpn: true,
      originalMpn: true,
      canonicalBrand: true,
      status: true,
      updatedAt: true,
    },
  })

  if (json) {
    console.log(JSON.stringify(items, null, 2))
    return
  }

  const total = await prisma.enrichmentJournal.count({
    where: { status: 'unresolved' },
  })
  console.log(`=== Unresolved (${Math.min(100, total)} из ${total}) ===`)
  for (const item of items) {
    console.log(
      `  ${item.canonicalMpn}  ${item.canonicalBrand}  ` +
        item.updatedAt.toISOString(),
    )
  }
  if (total > 100) {
    console.log(
      `  ... показано 100 из ${total}, используйте --json для полного списка`,
    )
  }
}

async function runSourceStatsReport() {
  const groups = await prisma.enrichmentJournal.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  const counts: Record<string, number> = {}
  for (const g of groups) counts[g.status] = g._count._all

  const chipdipHit = computeHitRate({
    done: counts.chipdip_done ?? 0,
    notFound: counts.chipdip_not_found ?? 0,
    blocked: counts.chipdip_blocked ?? 0,
  })
  const lcscHit = computeHitRate({
    done: counts.lcsc_done ?? 0,
    notFound: counts.lcsc_not_found ?? 0,
    blocked: counts.lcsc_blocked ?? 0,
  })
  const mouserHit = computeHitRate({
    done: counts.mouser_done ?? 0,
    notFound: counts.mouser_not_found ?? 0,
    failed: counts.mouser_failed ?? 0,
  })

  console.log('=== Source Stats ===')
  console.log(`  ChipDip hit rate: ${(chipdipHit * 100).toFixed(1)}%`)
  console.log(`  LCSC hit rate: ${(lcscHit * 100).toFixed(1)}%`)
  console.log(`  Mouser hit rate: ${(mouserHit * 100).toFixed(1)}%`)

  const pct = computeSourcesPercent({
    chipdip: counts.chipdip_done ?? 0,
    lcsc: counts.lcsc_done ?? 0,
    mouser: counts.mouser_done ?? 0,
  })
  console.log()
  console.log('--- Доля по источникам ---')
  console.log(
    `  ChipDip: ${pct.chipdip}%  LCSC: ${pct.lcsc}%  Mouser: ${pct.mouser}%`,
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
