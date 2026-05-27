import { EXCEL_TOTAL_DEFAULT } from '../constants/observability'

interface ImportProgressLite {
  totalProducts?: number | null
}

export function resolveExcelTotal(progress: ImportProgressLite | null): number {
  if (progress?.totalProducts && progress.totalProducts > 0) return progress.totalProducts
  return EXCEL_TOTAL_DEFAULT
}

export interface ExcelRemainder {
  remaining: number
  processed: number
  percent: number
}

export function computeExcelRemaining(args: {
  excelTotal: number
  doneCount: number
  unresolvedCount: number
}): ExcelRemainder {
  const processed = args.doneCount + args.unresolvedCount
  const remaining = Math.max(0, args.excelTotal - processed)
  const percent = args.excelTotal > 0 ? Math.round((processed / args.excelTotal) * 100) : 0
  return { remaining, processed, percent }
}

export function computeEtaSeconds(remaining: number, speedPerMin: number): number | null {
  if (speedPerMin <= 0) return null
  if (remaining === 0) return 0
  return Math.round((remaining / speedPerMin) * 60)
}

export function computeSpeedShort(
  events: ReadonlyArray<{ ts: number }>,
  now: number,
  windowMs = 5 * 60_000,
): number {
  const cutoff = now - windowMs
  const count = events.filter(e => e.ts >= cutoff && e.ts <= now).length
  return count / (windowMs / 60_000)
}

export function computeSpeedLong(processed: number, startedAt: number, now: number): number {
  if (now <= startedAt) return 0
  const hours = (now - startedAt) / 3_600_000
  return processed / hours
}

export interface SourceCounts {
  chipdip: number
  lcsc: number
  mouser: number
}

export interface SourcesPercent {
  chipdip: number
  lcsc: number
  mouser: number
}

export function computeSourcesPercent(counts: SourceCounts): SourcesPercent {
  const total = counts.chipdip + counts.lcsc + counts.mouser
  if (total === 0) return { chipdip: 0, lcsc: 0, mouser: 0 }
  return {
    chipdip: Math.round((counts.chipdip / total) * 100),
    lcsc: Math.round((counts.lcsc / total) * 100),
    mouser: Math.round((counts.mouser / total) * 100),
  }
}

export interface SourceAttempts {
  done: number
  notFound: number
  blocked?: number
  failed?: number
}

export function computeHitRate(attempts: SourceAttempts): number {
  const total =
    attempts.done + attempts.notFound + (attempts.blocked ?? 0) + (attempts.failed ?? 0)
  if (total === 0) return 0
  return attempts.done / total
}

export interface DurationStats {
  avg: number
  median: number
  p95: number
  min: number
  max: number
}

export function computeDurationStats(durations: number[]): DurationStats | null {
  if (durations.length === 0) return null
  const sorted = [...durations].sort((a, b) => a - b)
  const sum = sorted.reduce((s, n) => s + n, 0)
  const avg = sum / sorted.length
  const median = sorted[Math.floor(sorted.length / 2)]
  const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
  const p95 = sorted[p95Idx]
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  return { avg, median, p95, min, max }
}
