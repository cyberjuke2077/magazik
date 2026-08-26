/**
 * Enrichment Pipeline CLI Runner
 *
 * Entry point for running the product data enrichment pipeline.
 * Supports CLI flags to override config and control execution mode.
 *
 * Usage:
 *   npm run enrichment:run -- [options]
 *
 * Options:
 *   --input-dir <path>   Override ENRICHMENT_INPUT_DIR
 *   --batch-size <n>     Override ENRICHMENT_BATCH_SIZE
 *   --limit <n>          Process at most n deduplicated MPNs
 *   --resume             Continue previous run
 *   --dry-run            Only import/normalize, no API calls
 *   --skip-mouser        Skip Mouser queue
 *   --skip-lcsc          Skip LCSC queue
 *   --mouser-only        Only process Mouser queue
 *   --force-refresh      Re-fetch even recently completed products
 *   --no-tui             Disable TUI dashboard (legacy JSON mode)
 *   --log-mode           Same as --no-tui
 */

import 'dotenv/config'

import { loadEnrichmentConfig, runEnrichmentPipeline } from '../lib/enrichment'
import { type OrchestratorConfig } from '../lib/enrichment'
import { parseRunArgs } from '../lib/enrichment/observability/cli-args'
import {
  createEnrichmentEvents,
  createNoopEnrichmentEvents,
} from '../lib/enrichment/observability/event-bus'
import { createDashboardState } from '../lib/enrichment/observability/dashboard-state'

async function main(): Promise<void> {
  console.log('=== Enrichment Pipeline ===')
  console.log()

  const cliArgs = parseRunArgs(process.argv)

  const tuiEnabled =
    process.stdout.isTTY === true &&
    !cliArgs.noTui &&
    process.env.NO_TUI !== '1'

  const bus = tuiEnabled
    ? createEnrichmentEvents()
    : createNoopEnrichmentEvents()

  // Load base config from environment
  const baseConfig = loadEnrichmentConfig({
    requireDatabase: !cliArgs.dryRun,
  })

  // Build orchestrator config with CLI overrides
  // loggerSilent and progressSilentConsole start as false — they are
  // flipped to true only if TUI mounts successfully (see below).
  const config: OrchestratorConfig = {
    ...baseConfig,
    ...(cliArgs.inputDir && { inputDir: cliArgs.inputDir }),
    ...(cliArgs.batchSize && { batchSize: cliArgs.batchSize }),
    ...(cliArgs.limit && { limit: cliArgs.limit }),
    resume: cliArgs.resume,
    dryRun: cliArgs.dryRun,
    skipMouser: cliArgs.skipMouser,
    skipLcsc: cliArgs.skipLcsc,
    mouserOnly: cliArgs.mouserOnly,
    forceRefresh: cliArgs.forceRefresh,
    bus,
    loggerSilent: false,
    progressSilentConsole: false,
  }

  if (cliArgs.dryRun) {
    console.log('[dry-run] Only import/normalize, no API calls')
  }
  if (cliArgs.resume) {
    console.log('[resume] Continuing previous run')
  }
  if (cliArgs.forceRefresh) {
    console.log('[force-refresh] Fresh-product cache disabled')
  }

  console.log(`Input dir: ${config.inputDir}`)
  console.log(`Batch size: ${config.batchSize}`)
  if (config.limit !== undefined) console.log(`Trial limit: ${config.limit}`)
  console.log()

  const startTime = Date.now()

  // Mount TUI if enabled
  if (tuiEnabled) {
    try {
      const { render } = await import('ink')
      const React = await import('react')
      const { App } = await import('../components/enrichment-tui')
      const stateApi = createDashboardState({ excelTotal: 69_116 })

      bus.on('mpn_started', (p) => stateApi.applyEvent('mpn_started', p))
      bus.on('mpn_completed', (p) => stateApi.applyEvent('mpn_completed', p))
      bus.on('phase_changed', (p) => stateApi.applyEvent('phase_changed', p))
      bus.on('mouser_quota_used', (p) =>
        stateApi.applyEvent('mouser_quota_used', p),
      )
      bus.on('paused', (p) => stateApi.applyEvent('paused', p))
      bus.on('resumed', (p) => stateApi.applyEvent('resumed', p))
      bus.on('shutdown_initiated', (p) =>
        stateApi.applyEvent('shutdown_initiated', p),
      )

      render(React.createElement(App, { mode: 'live', stateApi, bus }))
      // TUI mounted successfully — suppress console output
      config.loggerSilent = true
      config.progressSilentConsole = true
    } catch (err) {
      // TUI failed — keep console output active (legacy mode)
      console.error('[tui] init failed:', err)
      console.log('[tui] Продолжаем в текстовом режиме')
    }
  }

  await runEnrichmentPipeline(config)

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log()
  console.log(`Done in ${duration}s`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      'Pipeline failed:',
      error instanceof Error ? error.message : error,
    )
    process.exit(1)
  })
