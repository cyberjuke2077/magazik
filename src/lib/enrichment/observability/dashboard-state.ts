import { RingBuffer } from './ring-buffer'
import {
  type EnrichmentEventMap,
  type EnrichmentJournalStatus,
  type EnrichmentPhase,
  type EnrichmentSourceKind,
} from './event-bus'
import { type CoverageMetrics } from './coverage-probe'

export interface RecentEvent {
  mpn: string
  brand: string
  source: EnrichmentSourceKind
  status: EnrichmentJournalStatus
  ts: number
}

export interface NotFoundEntry {
  mpn: string
  brand: string
  source: EnrichmentSourceKind
  ts: number
}

export interface CurrentMpn {
  mpn: string
  brand: string
  source: EnrichmentSourceKind
  startedAt: number
}

export interface BrandStat {
  done: number
  remaining: number
}

export interface DashboardState {
  runId: string | null
  phase: EnrichmentPhase
  paused: boolean
  helpVisible: boolean
  shutdownInitiated: boolean
  startedAt: number | null
  totalInQueue: number
  processedInQueue: number
  excelTotal: number
  excelRemaining: number
  statusCounts: Record<EnrichmentJournalStatus, number>
  brandStats: Map<string, BrandStat>
  mouserQuota: { used: number; limit: number }
  recentEvents: RingBuffer<RecentEvent>
  recentNotFound: RingBuffer<NotFoundEntry>
  coverage: (CoverageMetrics & { updatedAt: number }) | null
  currentMpn: CurrentMpn | null
}

export interface DashboardSnapshot {
  runId: string | null
  phase: EnrichmentPhase
  totalInQueue: number
  processedInQueue: number
  excelTotal: number
  excelRemaining: number
  statusCounts: Partial<Record<EnrichmentJournalStatus, number>>
  brandStats: Array<{ brand: string; done: number; remaining: number }>
  mouserQuota: { used: number; limit: number }
  recentEvents: RecentEvent[]
  recentNotFound: NotFoundEntry[]
  startedAt: number | null
}

export interface DashboardStateAPI {
  getState(): Readonly<DashboardState>
  applyEvent<K extends keyof EnrichmentEventMap>(
    event: K,
    payload: EnrichmentEventMap[K],
  ): void
  applySnapshot(snapshot: DashboardSnapshot): void
  applyCoverage(coverage: CoverageMetrics | null): void
  togglePause(): void
  toggleHelp(): void
  setShutdownInitiated(): void
  setRunId(runId: string | null): void
  setStartedAt(ts: number | null): void
  setExcelTotal(total: number): void
  setQueueTotal(total: number): void
  getVersion(): number
  subscribe(listener: () => void): () => void
}

const ALL_STATUSES: EnrichmentJournalStatus[] = [
  'pending',
  'chipdip_done',
  'chipdip_not_found',
  'chipdip_blocked',
  'lcsc_done',
  'lcsc_not_found',
  'lcsc_blocked',
  'mouser_queued',
  'mouser_done',
  'mouser_not_found',
  'mouser_failed',
  'mouser_brand_mismatch',
  'done',
  'unresolved',
]

const FINAL_STATUSES = new Set<EnrichmentJournalStatus>([
  'chipdip_done',
  'lcsc_done',
  'mouser_done',
  'mouser_not_found',
  'mouser_failed',
  'mouser_brand_mismatch',
  'done',
  'unresolved',
])

const NOT_FOUND_STATUSES = new Set<EnrichmentJournalStatus>([
  'chipdip_not_found',
  'lcsc_not_found',
  'mouser_not_found',
  'mouser_brand_mismatch',
  'unresolved',
])

const BRAND_TOP_LIMIT = 10
const RECENT_EVENTS_CAPACITY = 16
const RECENT_NOT_FOUND_CAPACITY = 5

function emptyStatusCounts(): Record<EnrichmentJournalStatus, number> {
  const out = {} as Record<EnrichmentJournalStatus, number>
  for (const s of ALL_STATUSES) out[s] = 0
  return out
}

export function createDashboardState(initial?: {
  excelTotal?: number
  totalInQueue?: number
  runId?: string | null
}): DashboardStateAPI {
  const state: DashboardState = {
    runId: initial?.runId ?? null,
    phase: 'idle',
    paused: false,
    helpVisible: false,
    shutdownInitiated: false,
    startedAt: null,
    totalInQueue: initial?.totalInQueue ?? 0,
    processedInQueue: 0,
    excelTotal: initial?.excelTotal ?? 0,
    excelRemaining: initial?.excelTotal ?? 0,
    statusCounts: emptyStatusCounts(),
    brandStats: new Map(),
    mouserQuota: { used: 0, limit: 1000 },
    recentEvents: new RingBuffer<RecentEvent>(RECENT_EVENTS_CAPACITY),
    recentNotFound: new RingBuffer<NotFoundEntry>(RECENT_NOT_FOUND_CAPACITY),
    coverage: null,
    currentMpn: null,
  }

  const listeners = new Set<() => void>()
  const trackedMpns = new Set<string>()
  const finalizedMpns = new Set<string>()
  let pendingNotify = false
  let version = 0

  function scheduleNotify(): void {
    version += 1
    if (pendingNotify) return
    pendingNotify = true
    setImmediate(() => {
      pendingNotify = false
      for (const l of listeners) {
        try {
          l()
        } catch {
          // ignore listener errors
        }
      }
    })
  }

  function bumpBrand(brand: string, isFinal: boolean): void {
    const cur = state.brandStats.get(brand) ?? { done: 0, remaining: 0 }
    if (isFinal) {
      cur.done += 1
      cur.remaining = Math.max(0, cur.remaining - 1)
    } else {
      cur.remaining += 1
    }
    state.brandStats.set(brand, cur)
    if (state.brandStats.size > BRAND_TOP_LIMIT * 2) {
      const sorted = Array.from(state.brandStats.entries())
        .sort((a, b) => b[1].done + b[1].remaining - (a[1].done + a[1].remaining))
        .slice(0, BRAND_TOP_LIMIT)
      state.brandStats = new Map(sorted)
    }
  }

  return {
    getState: () => state,
    applyEvent(event, payload) {
      switch (event) {
        case 'run_initialized': {
          const p = payload as EnrichmentEventMap['run_initialized']
          state.runId = p.runId
          state.startedAt = p.startedAt
          state.totalInQueue = p.total
          state.processedInQueue = p.processed
          state.excelTotal = p.total
          state.excelRemaining = Math.max(0, p.total - p.processed)
          break
        }
        case 'mpn_started': {
          const p = payload as EnrichmentEventMap['mpn_started']
          const key = `${p.brand}\u0000${p.mpn}`
          state.currentMpn = {
            mpn: p.mpn,
            brand: p.brand,
            source: p.source,
            startedAt: p.timestamp,
          }
          state.phase = sourcePhase(p.source)
          if (!trackedMpns.has(key)) {
            trackedMpns.add(key)
            bumpBrand(p.brand, false)
          }
          break
        }
        case 'mpn_completed': {
          const p = payload as EnrichmentEventMap['mpn_completed']
          const key = `${p.brand}\u0000${p.mpn}`
          state.statusCounts[p.status] = (state.statusCounts[p.status] ?? 0) + 1
          if (FINAL_STATUSES.has(p.status) && !finalizedMpns.has(key)) {
            finalizedMpns.add(key)
            state.processedInQueue += 1
            bumpBrand(p.brand, true)
          }
          state.recentEvents.push({
            mpn: p.mpn,
            brand: p.brand,
            source: p.source,
            status: p.status,
            ts: p.timestamp,
          })
          if (NOT_FOUND_STATUSES.has(p.status)) {
            state.recentNotFound.push({
              mpn: p.mpn,
              brand: p.brand,
              source: p.source,
              ts: p.timestamp,
            })
          }
          state.currentMpn = null
          state.excelRemaining = Math.max(
            0,
            state.excelTotal - state.processedInQueue,
          )
          break
        }
        case 'phase_changed': {
          const p = payload as EnrichmentEventMap['phase_changed']
          state.phase = p.to
          break
        }
        case 'mouser_quota_used': {
          const p = payload as EnrichmentEventMap['mouser_quota_used']
          state.mouserQuota = { used: p.used, limit: p.limit }
          break
        }
        case 'paused':
          state.paused = true
          break
        case 'resumed':
          state.paused = false
          break
        case 'shutdown_initiated':
          state.shutdownInitiated = true
          state.phase = 'shutting-down'
          break
      }
      scheduleNotify()
    },
    applySnapshot(snapshot) {
      state.runId = snapshot.runId
      state.phase = snapshot.phase
      state.totalInQueue = snapshot.totalInQueue
      state.processedInQueue = snapshot.processedInQueue
      state.excelTotal = snapshot.excelTotal
      state.excelRemaining = snapshot.excelRemaining
      state.startedAt = snapshot.startedAt
      for (const s of ALL_STATUSES) state.statusCounts[s] = snapshot.statusCounts[s] ?? 0
      state.brandStats = new Map(
        snapshot.brandStats.map(b => [b.brand, { done: b.done, remaining: b.remaining }]),
      )
      state.mouserQuota = snapshot.mouserQuota
      state.recentEvents = new RingBuffer<RecentEvent>(RECENT_EVENTS_CAPACITY)
      for (const e of [...snapshot.recentEvents].reverse()) state.recentEvents.push(e)
      state.recentNotFound = new RingBuffer<NotFoundEntry>(RECENT_NOT_FOUND_CAPACITY)
      for (const e of [...snapshot.recentNotFound].reverse()) state.recentNotFound.push(e)
      scheduleNotify()
    },
    applyCoverage(coverage) {
      state.coverage = coverage ? { ...coverage, updatedAt: Date.now() } : null
      scheduleNotify()
    },
    togglePause() {
      state.paused = !state.paused
      scheduleNotify()
    },
    toggleHelp() {
      state.helpVisible = !state.helpVisible
      scheduleNotify()
    },
    setShutdownInitiated() {
      state.shutdownInitiated = true
      state.phase = 'shutting-down'
      scheduleNotify()
    },
    setRunId(runId) {
      state.runId = runId
      scheduleNotify()
    },
    setStartedAt(ts) {
      state.startedAt = ts
      scheduleNotify()
    },
    setExcelTotal(total) {
      state.excelTotal = total
      state.excelRemaining = Math.max(0, total - state.processedInQueue)
      scheduleNotify()
    },
    setQueueTotal(total) {
      state.totalInQueue = total
      scheduleNotify()
    },
    getVersion: () => version,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

function sourcePhase(source: EnrichmentSourceKind): EnrichmentPhase {
  if (source === 'chipdip') return 'chipdip-queue'
  if (source === 'lcsc') return 'lcsc-queue'
  return 'mouser-queue'
}
