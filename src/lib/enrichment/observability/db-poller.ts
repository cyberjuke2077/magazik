import { prisma } from '../../prisma'
import { type DashboardStateAPI, type DashboardSnapshot } from './dashboard-state'
import { type EnrichmentLogger } from './logger'
import { type EnrichmentJournalStatus, type EnrichmentPhase } from './event-bus'
import { resolveExcelTotal } from './metrics'

export async function loadDashboardSnapshot(): Promise<DashboardSnapshot> {
  // 1. Найти последний ImportProgress
  const importProgress = await prisma.importProgress.findFirst({
    orderBy: { createdAt: 'desc' },
  })

  // 2. Группировка journal по статусам
  const journalGroups = await prisma.enrichmentJournal.groupBy({
    by: ['status'],
    _count: { status: true },
    ...(importProgress ? { where: { runId: importProgress.id } } : {}),
  })

  const statusCounts: Partial<Record<EnrichmentJournalStatus, number>> = {}
  for (const g of journalGroups) {
    statusCounts[g.status as EnrichmentJournalStatus] = g._count.status
  }

  // 3. Top-10 brands
  const brandGroups = await prisma.enrichmentJournal.groupBy({
    by: ['canonicalBrand', 'status'],
    _count: { _all: true },
    ...(importProgress ? { where: { runId: importProgress.id } } : {}),
  })

  const FINAL = new Set([
    'chipdip_done',
    'lcsc_done',
    'mouser_done',
    'mouser_not_found',
    'mouser_failed',
    'mouser_brand_mismatch',
    'done',
    'unresolved',
  ])
  const brandMap = new Map<string, { done: number; remaining: number }>()
  for (const b of brandGroups) {
    const cur = brandMap.get(b.canonicalBrand) ?? { done: 0, remaining: 0 }
    if (FINAL.has(b.status)) cur.done += b._count._all
    else cur.remaining += b._count._all
    brandMap.set(b.canonicalBrand, cur)
  }
  const brandStats = Array.from(brandMap.entries())
    .map(([brand, s]) => ({ brand, done: s.done, remaining: s.remaining }))
    .sort((a, b) => (b.done + b.remaining) - (a.done + a.remaining))
    .slice(0, 10)

  // 4. Recent 16 events
  const recent = await prisma.enrichmentJournal.findMany({
    ...(importProgress ? { where: { runId: importProgress.id } } : {}),
    orderBy: { updatedAt: 'desc' },
    take: 16,
    select: {
      canonicalMpn: true,
      canonicalBrand: true,
      status: true,
      updatedAt: true,
    },
  })

  const recentEvents = recent.map(r => ({
    mpn: r.canonicalMpn,
    brand: r.canonicalBrand,
    source: deriveSource(r.status as EnrichmentJournalStatus),
    status: r.status as EnrichmentJournalStatus,
    ts: r.updatedAt.getTime(),
  }))

  // 5. Recent 5 not_found
  const notFoundStatuses: EnrichmentJournalStatus[] = [
    'chipdip_not_found',
    'lcsc_not_found',
    'mouser_not_found',
    'mouser_brand_mismatch',
    'unresolved',
  ]
  const notFound = await prisma.enrichmentJournal.findMany({
    where: {
      ...(importProgress ? { runId: importProgress.id } : {}),
      status: { in: notFoundStatuses },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      canonicalMpn: true,
      canonicalBrand: true,
      status: true,
      updatedAt: true,
    },
  })

  const recentNotFound = notFound.map(r => ({
    mpn: r.canonicalMpn,
    brand: r.canonicalBrand,
    source: deriveSource(r.status as EnrichmentJournalStatus),
    ts: r.updatedAt.getTime(),
  }))

  // 6. Mouser quota today
  const today = new Date().toISOString().slice(0, 10)
  const mouserUsed = await prisma.enrichmentJournal.count({
    where: { mouserDay: today },
  })

  // 7. Compute totals
  const totalInQueue = importProgress?.totalProducts ?? 0
  const processedInQueue =
    (statusCounts.chipdip_done ?? 0) +
    (statusCounts.lcsc_done ?? 0) +
    (statusCounts.mouser_done ?? 0) +
    (statusCounts.mouser_not_found ?? 0) +
    (statusCounts.mouser_failed ?? 0) +
    (statusCounts.mouser_brand_mismatch ?? 0) +
    (statusCounts.done ?? 0) +
    (statusCounts.unresolved ?? 0)
  const excelTotal = resolveExcelTotal(importProgress)
  const excelRemaining = Math.max(0, excelTotal - processedInQueue)

  return {
    runId: importProgress?.id ?? null,
    phase: derivePhase(importProgress?.status, statusCounts),
    totalInQueue,
    processedInQueue,
    excelTotal,
    excelRemaining,
    statusCounts,
    brandStats,
    mouserQuota: { used: mouserUsed, limit: 1000 },
    recentEvents,
    recentNotFound,
    startedAt: importProgress?.startedAt?.getTime() ?? null,
  }
}

function deriveSource(
  status: EnrichmentJournalStatus,
): 'chipdip' | 'lcsc' | 'mouser' {
  if (status.startsWith('chipdip')) return 'chipdip'
  if (status.startsWith('lcsc')) return 'lcsc'
  if (status.startsWith('mouser')) return 'mouser'
  return 'chipdip'
}

function derivePhase(
  importStatus: string | undefined,
  counts: Partial<Record<EnrichmentJournalStatus, number>>,
): EnrichmentPhase {
  if (importStatus !== 'running') return 'idle'
  if ((counts.pending ?? 0) > 0) return 'chipdip-queue'
  if ((counts.chipdip_not_found ?? 0) > 0) return 'lcsc-queue'
  if ((counts.lcsc_not_found ?? 0) > 0) return 'mouser-queue'
  return 'idle'
}

export interface DbPollerOptions {
  intervalMs?: number
  logger?: EnrichmentLogger
}

const MAX_FAILURES = 3

export function startDbPoller(
  api: DashboardStateAPI,
  options: DbPollerOptions = {},
): () => void {
  const intervalMs = options.intervalMs ?? 2000
  let stopped = false
  let consecutiveFailures = 0

  const tick = async (): Promise<void> => {
    if (stopped) return
    try {
      const snapshot = await loadDashboardSnapshot()
      api.applySnapshot(snapshot)
      consecutiveFailures = 0
    } catch (err) {
      consecutiveFailures++
      if (consecutiveFailures >= MAX_FAILURES) {
        options.logger?.error({
          event: 'db_poll_failed',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  void tick()
  const handle = setInterval(() => void tick(), intervalMs)
  return () => {
    stopped = true
    clearInterval(handle)
  }
}
