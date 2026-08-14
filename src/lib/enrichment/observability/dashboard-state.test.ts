import { describe, expect, it, vi } from 'vitest'

import { createDashboardState } from './dashboard-state'

describe('createDashboardState', () => {
  it('initializes real run counters from an event', async () => {
    const stateApi = createDashboardState()
    const listener = vi.fn()
    stateApi.subscribe(listener)

    stateApi.applyEvent('run_initialized', {
      runId: 'run-test',
      total: 42,
      startedAt: 123,
    })
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(stateApi.getState()).toMatchObject({
      runId: 'run-test',
      totalInQueue: 42,
      excelTotal: 42,
      excelRemaining: 42,
      startedAt: 123,
    })
    expect(listener).toHaveBeenCalledOnce()
  })

  it('updates remaining items after completion', () => {
    const stateApi = createDashboardState({ excelTotal: 2, totalInQueue: 2 })

    stateApi.applyEvent('mpn_completed', {
      mpn: 'NE555P',
      brand: 'Texas Instruments',
      source: 'chipdip',
      status: 'chipdip_done',
      durationMs: 100,
      timestamp: 456,
    })

    expect(stateApi.getState()).toMatchObject({
      processedInQueue: 1,
      excelRemaining: 1,
    })
  })

  it('does not count a fallback transition as a finished product', () => {
    const stateApi = createDashboardState({ excelTotal: 1, totalInQueue: 1 })

    stateApi.applyEvent('mpn_completed', {
      mpn: 'UNKNOWN',
      brand: '',
      source: 'chipdip',
      status: 'chipdip_not_found',
      durationMs: 100,
      timestamp: 456,
    })

    expect(stateApi.getState()).toMatchObject({
      processedInQueue: 0,
      excelRemaining: 1,
    })
  })
})
