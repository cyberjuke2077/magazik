import React from 'react'
import { render } from 'ink-testing-library'
import { describe, expect, it } from 'vitest'

import { createDashboardState } from '@/lib/enrichment/observability/dashboard-state'
import { createEnrichmentEvents } from '@/lib/enrichment/observability/event-bus'
import { App } from './app'

describe('Enrichment TUI', () => {
  it('rerenders when the parser state changes', async () => {
    const stateApi = createDashboardState()
    const view = render(<App mode="live" stateApi={stateApi} />)

    expect(view.lastFrame()).toContain('ПАРСЕР КАТАЛОГА')
    expect(view.lastFrame()).toContain('подготовка')
    await new Promise<void>((resolve) => setImmediate(resolve))

    stateApi.applyEvent('run_initialized', {
      runId: 'run-test',
      total: 3,
      startedAt: 123,
    })
    stateApi.applyEvent('phase_changed', {
      from: 'idle',
      to: 'chipdip-queue',
      timestamp: 124,
    })
    await new Promise<void>((resolve) => setImmediate(resolve))

    expect(view.lastFrame()).toContain('run-test')
    expect(view.lastFrame()).toContain('Этап: ChipDip')
    expect(view.lastFrame()).toContain('0/3 (0%)')
    view.unmount()
  })

  it('requests graceful shutdown from the event bus on q', async () => {
    const stateApi = createDashboardState()
    const bus = createEnrichmentEvents()
    const shutdown = new Promise<string>((resolve) => {
      bus.on('shutdown_initiated', ({ source }) => resolve(source))
    })
    const view = render(<App mode="live" stateApi={stateApi} bus={bus} />)

    view.stdin.write('q')

    await expect(shutdown).resolves.toBe('hotkey')
    view.unmount()
  })
})
