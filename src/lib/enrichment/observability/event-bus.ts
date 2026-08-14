import { EventEmitter } from 'node:events'

export type EnrichmentSourceKind = 'chipdip' | 'lcsc' | 'mouser'

export type EnrichmentPhase =
  | 'idle'
  | 'chipdip-queue'
  | 'lcsc-queue'
  | 'mouser-queue'
  | 'shutting-down'

export type EnrichmentJournalStatus =
  | 'pending'
  | 'chipdip_done'
  | 'chipdip_not_found'
  | 'chipdip_blocked'
  | 'lcsc_done'
  | 'lcsc_not_found'
  | 'lcsc_blocked'
  | 'mouser_done'
  | 'mouser_not_found'
  | 'mouser_failed'
  | 'mouser_brand_mismatch'
  | 'done'
  | 'unresolved'

export interface EnrichmentEventMap {
  run_initialized: {
    runId: string
    total: number
    startedAt: number
  }
  mpn_started: {
    mpn: string
    brand: string
    source: EnrichmentSourceKind
    timestamp: number
  }
  mpn_completed: {
    mpn: string
    brand: string
    source: EnrichmentSourceKind
    status: EnrichmentJournalStatus
    durationMs: number
    timestamp: number
  }
  phase_changed: {
    from: EnrichmentPhase
    to: EnrichmentPhase
    timestamp: number
  }
  mouser_quota_used: {
    used: number
    limit: number
    timestamp: number
  }
  paused: {
    reason: 'hotkey' | 'block' | 'manual'
    timestamp: number
  }
  resumed: {
    timestamp: number
  }
  shutdown_initiated: {
    source: 'hotkey' | 'signal'
    timestamp: number
  }
}

export interface EnrichmentEvents {
  emit<K extends keyof EnrichmentEventMap>(event: K, payload: EnrichmentEventMap[K]): void
  on<K extends keyof EnrichmentEventMap>(
    event: K,
    handler: (payload: EnrichmentEventMap[K]) => void,
  ): () => void
  off<K extends keyof EnrichmentEventMap>(
    event: K,
    handler: (payload: EnrichmentEventMap[K]) => void,
  ): void
}

export function createEnrichmentEvents(): EnrichmentEvents {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(50)
  // Track wrapped handlers so off() can find original
  const wrapperMap = new WeakMap<(...args: unknown[]) => void, (...args: unknown[]) => void>()

  return {
    emit<K extends keyof EnrichmentEventMap>(event: K, payload: EnrichmentEventMap[K]): void {
      emitter.emit(event, payload)
    },
    on<K extends keyof EnrichmentEventMap>(
      event: K,
      handler: (payload: EnrichmentEventMap[K]) => void,
    ): () => void {
      const wrapper = (p: unknown): void => {
        try {
          handler(p as EnrichmentEventMap[K])
        } catch (err) {
          process.stderr.write(
            `[event-bus] subscriber error for ${String(event)}: ${String(err)}\n`,
          )
        }
      }
      wrapperMap.set(handler as (...a: unknown[]) => void, wrapper as (...a: unknown[]) => void)
      emitter.on(event, wrapper)
      return () => emitter.off(event, wrapper)
    },
    off<K extends keyof EnrichmentEventMap>(
      event: K,
      handler: (payload: EnrichmentEventMap[K]) => void,
    ): void {
      const wrapper = wrapperMap.get(handler as (...a: unknown[]) => void)
      if (wrapper) emitter.off(event, wrapper)
    },
  }
}

// No-op event bus for tests / dry-run / when TUI is disabled.
export function createNoopEnrichmentEvents(): EnrichmentEvents {
  return {
    emit: () => undefined,
    on: () => () => undefined,
    off: () => undefined,
  }
}
