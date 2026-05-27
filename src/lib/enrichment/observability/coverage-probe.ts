import { prisma } from '../../prisma'
import { type EnrichmentLogger } from './logger'

export interface CoverageMetrics {
  totalEnriched: number
  withDescription: number
  withSpecs: number
  withDatasheet: number
  withCategory: number
}

export async function loadCoverage(): Promise<CoverageMetrics | null> {
  const baseWhere = { enrichmentStatus: { in: ['complete', 'partial'] } }

  const [total, withDescription, withSpecs, withDatasheet, withCategory] =
    await prisma.$transaction([
      prisma.product.count({ where: baseWhere }),
      prisma.product.count({
        where: {
          ...baseWhere,
          description: { not: null },
          NOT: { description: { in: ['', 'Нет данных'] } },
        },
      }),
      prisma.product.count({
        where: { ...baseWhere, specifications: { some: {} } },
      }),
      prisma.product.count({
        where: { ...baseWhere, datasheets: { some: {} } },
      }),
      prisma.product.count({
        where: { ...baseWhere, NOT: { category: { slug: 'uncategorized' } } },
      }),
    ])

  if (total === 0) return null
  return {
    totalEnriched: total,
    withDescription,
    withSpecs,
    withDatasheet,
    withCategory,
  }
}

export interface CoverageProbeApi {
  applyCoverage(coverage: CoverageMetrics | null): void
}

export interface CoverageProbeOptions {
  intervalMs?: number
  logger?: EnrichmentLogger
}

const MAX_CONSECUTIVE_FAILURES = 3

// Starts polling coverage. Returns a stop function.
export function startCoverageProbe(
  api: CoverageProbeApi,
  options: CoverageProbeOptions = {},
): () => void {
  const intervalMs = options.intervalMs ?? 30_000
  let stopped = false
  let consecutiveFailures = 0

  const tick = async (): Promise<void> => {
    if (stopped) return
    try {
      const coverage = await loadCoverage()
      api.applyCoverage(coverage)
      consecutiveFailures = 0
    } catch (err) {
      consecutiveFailures++
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        api.applyCoverage(null)
        options.logger?.error({
          event: 'coverage_probe_failed',
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  // Fire-and-forget initial tick
  void tick()
  const handle = setInterval(() => void tick(), intervalMs)
  return () => {
    stopped = true
    clearInterval(handle)
  }
}
