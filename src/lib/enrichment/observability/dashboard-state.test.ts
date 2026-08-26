import { describe, expect, it, vi } from 'vitest'

import { createDashboardState } from './dashboard-state'

describe('createDashboardState', () => {
  it('initializes counters from the actual run size and notifies subscribers', async () => {
    const stateApi = createDashboardState()
    const listener = vi.fn()
    stateApi.subscribe(listener)

    stateApi.applyEvent('run_initialized', {
      runId: 'run-test',
      total: 42,
      processed: 5,
      startedAt: 123,
    })
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(stateApi.getState()).toMatchObject({
      runId: 'run-test',
      totalInQueue: 42,
      processedInQueue: 5,
      excelTotal: 42,
      excelRemaining: 37,
      startedAt: 123,
    })
    expect(listener).toHaveBeenCalledOnce()
    expect(stateApi.getVersion()).toBeGreaterThan(0)
  })

  it('counts a product only after its final source result', () => {
    const stateApi = createDashboardState({ excelTotal: 1, totalInQueue: 1 })

    stateApi.applyEvent('mpn_started', event('chipdip'))
    stateApi.applyEvent('mpn_completed', completed('chipdip', 'chipdip_not_found'))
    expect(stateApi.getState().processedInQueue).toBe(0)

    stateApi.applyEvent('mpn_started', event('lcsc'))
    stateApi.applyEvent('mpn_completed', completed('lcsc', 'lcsc_done'))
    expect(stateApi.getState()).toMatchObject({
      processedInQueue: 1,
      excelRemaining: 0,
    })
  })
})

function event(source: 'chipdip' | 'lcsc' | 'mouser') {
  return {
    mpn: 'NE555P',
    brand: 'Texas Instruments',
    source,
    timestamp: 123,
  }
}

function completed(
  source: 'chipdip' | 'lcsc' | 'mouser',
  status: 'chipdip_not_found' | 'lcsc_done',
) {
  return { ...event(source), status, durationMs: 100 }
}
