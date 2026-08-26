/**
 * Enrichment Pipeline Orchestrator
 *
 * Main coordination logic for the product data enrichment pipeline.
 * Manages three parallel processing loops (ChipDip, LCSC, Mouser)
 * with graceful shutdown, resume support, and progress tracking.
 */

import { prisma } from '../prisma'
import {
  type EnrichmentConfig,
  type EnrichmentItemStatus,
  type EnrichmentResult,
  type PartIdentity,
} from './types'
import { importSupplierFiles } from './ingest/excel-importer'
import { deduplicate } from './ingest/deduplicator'
import { createStatusJournal, type StatusJournal } from './queue/status-journal'
import { createChipDipClient, type ChipDipClient } from './sources/chipdip-client'
import {
  createLcscClient,
  LcscBlockedError,
  type LcscClient,
} from './sources/lcsc-client'
import {
  createMouserClient,
  QuotaExhaustedError,
  type MouserClient,
} from './sources/mouser-client'
import { persistBatch } from './persistence/persistence-service'
import { createLogger, type EnrichmentLogger } from './observability/logger'
import { createProgressReporter, type ProgressReporter } from './observability/progress-reporter'
import { closeAllBrowsers, installExitHandlers, shutdownWithCleanup } from './browser-registry'
import {
  type EnrichmentEvents,
  createNoopEnrichmentEvents,
} from './observability/event-bus'
import { filterFreshProducts } from './queue/fresh-product-filter'
import { loadResumableRun } from './queue/resume-run'
import { hasResolvedManufacturer } from './persistence/manufacturer-resolver'

export interface OrchestratorConfig extends EnrichmentConfig {
  resume?: boolean
  dryRun?: boolean
  skipMouser?: boolean
  skipLcsc?: boolean
  skipChipdip?: boolean
  mouserOnly?: boolean
  forceRefresh?: boolean
  /** Maximum number of deduplicated MPNs to process, for controlled trial runs. */
  limit?: number
  bus?: EnrichmentEvents
  loggerSilent?: boolean
  progressSilentConsole?: boolean
}

/** Polling interval when waiting for items from upstream queue */
const QUEUE_POLL_INTERVAL_MS = 30_000

/** Batch size for fetching items from journal */
const FETCH_BATCH_SIZE = 100

/**
 * Delays execution for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generates a unique run ID based on current timestamp.
 */
function generateRunId(): string {
  const now = new Date()
  return `run-${now.toISOString().slice(0, 19).replace(/[T:]/g, '-')}`
}

async function selectNewRunParts(
  deduplicatedParts: PartIdentity[],
  config: OrchestratorConfig,
): Promise<PartIdentity[]> {
  const cacheResult =
    config.skipFreshProducts && !config.forceRefresh
      ? await filterFreshProducts(deduplicatedParts, config.freshnessDays)
      : { pending: deduplicatedParts, skipped: 0 }
  const parts = config.limit === undefined
    ? cacheResult.pending
    : cacheResult.pending.slice(0, config.limit)

  console.log(`   Пропущено свежих карточек: ${cacheResult.skipped}`)
  if (config.limit !== undefined) {
    console.log(
      `   Лимит пробного запуска: ${config.limit} (будет обработано: ${parts.length})`,
    )
  }
  if (parts.length === 0) {
    console.log(`\n🏁 Все карточки свежие. Запросы к источникам не выполнялись.`)
  }
  return parts
}

/**
 * Runs the enrichment pipeline.
 *
 * Flow:
 * 1. Create logger, progress reporter
 * 2. Load and import Excel files → normalize → deduplicate
 * 3. If dryRun: log stats and exit
 * 4. Create ImportProgress record in DB
 * 5. Init StatusJournal (or resume from existing)
 * 6. Initialize enabled sources and route skipped or blocked stages forward
 * 7. Start THREE parallel processing loops
 * 8. After all loops complete: generate final report
 * 9. Graceful shutdown on SIGINT/SIGTERM
 */
export async function runEnrichmentPipeline(config: OrchestratorConfig): Promise<void> {
  // Guarantee Chromium child processes are killed on uncaughtException,
  // unhandledRejection, or process.on('exit') — even if the orchestrator
  // never reaches its `finally` block.
  installExitHandlers()

  const bus = config.bus ?? createNoopEnrichmentEvents()
  const logger = createLogger({ silent: config.loggerSilent })
  const progress = createProgressReporter({
    silentConsole: config.progressSilentConsole,
  })
  const journal = createStatusJournal()

  let shutdownRequested = false
  let chipdipClient: ChipDipClient | null = null
  let lcscClient: LcscClient | null = null
  const activeLoops: Promise<void>[] = []

  // Graceful shutdown handler
  // Runs the shared shutdown pipeline (`shutdownWithCleanup`) which awaits
  // in-flight loops, force-closes tracked browsers, and calls process.exit.
  // After this function the process is gone — the orchestrator's `finally`
  // block does NOT run on signal-driven shutdown (that's OK, cleanup is
  // already done). Normal completion still goes through the `finally` path.
  async function gracefulShutdown(signal: string): Promise<void> {
    shutdownRequested = true
    logger.info({ event: 'shutdown_step', step: 'flag_set', durationMs: 0 })
    await shutdownWithCleanup({
      signal,
      code: signal === 'SIGINT' ? 130 : 0,
      inFlightTimeoutMs: 10_000,
      closeTimeoutMs: 5_000,
      waitInFlight: async () => {
        // Wait for the parallel loops to observe `shutdownRequested` and exit
        // their iteration cleanly. `allSettled` ensures one loop's failure
        // doesn't abort the wait for the others.
        await Promise.allSettled(activeLoops)
      },
    })
  }

  function handleShutdown(signal: string): void {
    if (shutdownRequested) return
    logger.warn({ event: `shutdown_requested`, source: signal })
    console.log(`\n⚠️  Получен ${signal}, завершаем текущие операции...`)
    bus.emit('shutdown_initiated', {
      source: 'signal',
      timestamp: Date.now(),
    })
    void gracefulShutdown(signal)
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'))
  process.on('SIGTERM', () => handleShutdown('SIGTERM'))
  const unsubscribeHotkeyShutdown = bus.on(
    'shutdown_initiated',
    ({ source }) => {
      if (source === 'hotkey') handleShutdown('SIGINT')
    },
  )

  try {
    // Step 1: Import and deduplicate
    logger.info({ event: 'pipeline_start' })
    console.log(`\n🚀 Запуск пайплайна обогащения`)
    console.log(`   Входная папка: ${config.inputDir}`)

    const { rows, stats: importStats } = importSupplierFiles(config.inputDir)

    logger.info({
      event: 'import_complete',
      durationMs: 0,
    })

    console.log(`\n📁 Импорт завершён:`)
    console.log(`   Файлов: ${importStats.totalFiles} (с заголовками: ${importStats.filesWithHeaders}, без: ${importStats.filesWithoutHeaders}, пропущено: ${importStats.skippedFiles})`)
    console.log(`   Строк: ${importStats.totalRows} (пропущено: ${importStats.skippedRows})`)

    // Step 2: Deduplicate
    const deduplicatedParts = deduplicate(rows)

    // A dry run validates only the input contract. It must not query the
    // freshness cache, initialize a journal, call sources, or write data.
    if (config.dryRun) {
      const dryRunParts = config.limit === undefined
        ? deduplicatedParts
        : deduplicatedParts.slice(0, config.limit)
      console.log(`   Уникальных артикулов: ${deduplicatedParts.length}`)
      if (config.limit !== undefined) {
        console.log(`   Лимит пробного запуска: ${config.limit} (будет обработано: ${dryRunParts.length})`)
      }
      logger.info({ event: 'dry_run_complete' })
      console.log(`\n🏁 Dry run завершён. Без обращения к БД и внешним источникам.`)
      return
    }

    console.log(`   Уникальных артикулов: ${deduplicatedParts.length}`)
    const resumedRun = config.resume ? await loadResumableRun() : null
    const parts = resumedRun
      ? []
      : await selectNewRunParts(deduplicatedParts, config)

    if (!resumedRun && parts.length === 0) return

    // Step 4: Create ImportProgress record
    const runId = resumedRun?.id ?? generateRunId()
    const runTotal = resumedRun?.totalProducts ?? parts.length

    if (!resumedRun) {
      await prisma.importProgress.create({
        data: {
          id: runId,
          status: 'running',
          totalProducts: parts.length,
          startedAt: new Date(),
        },
      })
    }

    // Step 5: Init journal (or resume)
    let alreadyProcessed = 0
    if (!resumedRun) {
      const inserted = await journal.initJournal(runId, parts)
      logger.info({ event: 'journal_initialized', durationMs: 0 })
      console.log(`   Записей в журнале: ${inserted}`)
    } else {
      // Re-queue any chipdip_blocked items so they get a second chance.
      // Items that exceeded the retry budget are promoted to
      // chipdip_not_found so LCSC can pick them up.
      const requeued = await journal.requeueBlockedItems(runId)
      if (requeued > 0) {
        console.log(`   Возвращено в очередь после блокировки: ${requeued}`)
      }
      const resumable = await journal.getResumableItems(runId)
      alreadyProcessed = Math.max(0, runTotal - resumable)
      console.log(`   Возобновление run ${runId}: ${resumable} артикулов осталось`)
    }

    // Start progress reporter
    bus.emit('run_initialized', {
      runId,
      total: runTotal,
      processed: alreadyProcessed,
      startedAt: resumedRun?.startedAt?.getTime() ?? Date.now(),
    })
    progress.start(runId, runTotal)

    const runChipDip = !config.mouserOnly && !config.skipChipdip
    const runLcsc = !config.mouserOnly && !config.skipLcsc
    let lcscAvailable = runLcsc

    if (!runChipDip) {
      const skipped = await journal.skipPendingChipDip(
        runId,
        config.mouserOnly
          ? 'ChipDip skipped by --mouser-only'
          : 'ChipDip skipped by operator',
      )
      console.log(`\n⏭️  ChipDip пропущен. Передано дальше: ${skipped}`)
    }

    if (!runLcsc) {
      const skipped = await journal.routePendingLcsc(
        runId,
        'lcsc_not_found',
        config.mouserOnly
          ? 'LCSC skipped by --mouser-only'
          : 'LCSC skipped by operator',
      )
      console.log(`⏭️  LCSC пропущен. Передано дальше: ${skipped}`)
    }

    // Step 6: Health-check ChipDip. A failed source must not stop the cascade.
    if (runChipDip) {
      try {
        chipdipClient = await createChipDipClient({
          proxyTemplate: config.chipdipProxyTemplate,
          proxyUrl: config.chipdipProxyUrl,
          proxyUserRange: config.chipdipProxyUserRange,
          concurrency: config.chipdipConcurrency,
          requestDelayRange: config.chipdipRequestDelayRange,
          pageDelayRange: config.chipdipPageDelayRange,
        })

        const healthy = await chipdipClient.healthCheck()
        if (!healthy) {
          throw new Error('ChipDip health-check failed')
        }
        logger.info({ event: 'chipdip_healthcheck_ok', source: 'chipdip' })
        console.log(`\n✅ ChipDip health-check пройден`)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        logger.error({ event: 'chipdip_healthcheck_failed', source: 'chipdip' })
        await chipdipClient?.close().catch(() => {})
        chipdipClient = null
        const skipped = await journal.skipPendingChipDip(
          runId,
          `${errorMsg}; routed to fallback`,
        )
        if (!lcscAvailable) {
          await journal.routePendingLcsc(
            runId,
            'lcsc_not_found',
            'LCSC unavailable after ChipDip health-check failure',
          )
        }
        console.warn(`\n⚠️  ChipDip недоступен. Передано дальше: ${skipped}`)
      }
    }

    // Init LCSC client (if needed)
    if (runLcsc) {
      try {
        lcscClient = await createLcscClient()
        logger.info({ event: 'lcsc_client_ready', source: 'lcsc' })
      } catch (err) {
        lcscAvailable = false
        const errorMsg = err instanceof Error ? err.message : String(err)
        const skipped = await journal.routePendingLcsc(
          runId,
          'lcsc_not_found',
          `LCSC initialization failed: ${errorMsg}`,
        )
        logger.error({
          event: 'lcsc_init_failed',
          source: 'lcsc',
          error: errorMsg,
        })
        console.warn(`\n⚠️  LCSC не запущен. Передано в Mouser: ${skipped}`)
      }
    }

    // Init Mouser client
    const mouserClient = createMouserClient({ apiKey: config.mouserApiKey })

    // Step 7: Start parallel processing loops
    console.log(`\n⚡ Запуск параллельных очередей...`)

    if (chipdipClient) {
      activeLoops.push(
        runChipDipLoop(
          runId,
          journal,
          chipdipClient,
          logger,
          progress,
          bus,
          () => lcscAvailable,
          () => shutdownRequested,
        ),
      )
    }

    if (lcscClient) {
      activeLoops.push(
        runLcscLoop(
          runId,
          journal,
          lcscClient,
          logger,
          progress,
          bus,
          () => {
            lcscAvailable = false
          },
          () => shutdownRequested,
        ),
      )
    }

    if (!config.skipMouser && config.mouserApiKey) {
      activeLoops.push(
        runMouserLoop(runId, journal, mouserClient, logger, progress, config, bus, () => shutdownRequested),
      )
    } else {
      // No Mouser → finalizer loop promotes lcsc_not_found to unresolved
      // with a stub Product, so MPNs aren't lost.
      activeLoops.push(
        runUnresolvedFinalizerLoop(
          runId, journal, logger, progress, bus, () => shutdownRequested,
        ),
      )
    }

    await Promise.all(activeLoops)

    // Step 8: Final report
    logger.info({ event: 'pipeline_complete' })
    progress.stop()

    // Mark ImportProgress as completed
    await prisma.importProgress.update({
      where: { id: runId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    console.log(`\n🏁 Пайплайн завершён.`)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logger.error({ event: 'pipeline_error', error: errorMsg })
    console.error(`\n❌ Ошибка пайплайна: ${errorMsg}`)
    progress.stop()
    throw err
  } finally {
    unsubscribeHotkeyShutdown()
    // Cleanup
    if (chipdipClient) {
      await chipdipClient.close().catch(() => {})
    }
    if (lcscClient) {
      await lcscClient.close().catch(() => {})
    }
    // Final safety net: force-close any browser still tracked in the registry
    // (e.g. orphaned by an aborted session rotation).
    await closeAllBrowsers()
  }
}

/**
 * ChipDip processing loop.
 * Processes items with status `pending`.
 */
async function runChipDipLoop(
  runId: string,
  journal: StatusJournal,
  client: ChipDipClient,
  logger: EnrichmentLogger,
  progress: ProgressReporter,
  bus: EnrichmentEvents,
  isLcscAvailable: () => boolean,
  isShutdown: () => boolean,
): Promise<void> {
  while (!isShutdown()) {
    const batch = await journal.getNextBatch(runId, 'pending', FETCH_BATCH_SIZE)

    if (batch.length === 0) {
      // No more pending items — wait and check again (LCSC/Mouser may still be running)
      await sleep(QUEUE_POLL_INTERVAL_MS)
      // Check again
      const recheck = await journal.getNextBatch(runId, 'pending', 1)
      if (recheck.length === 0) break
      continue
    }

    for (const part of batch) {
      if (isShutdown()) break

      const startMs = Date.now()
      bus.emit('mpn_started', {
        mpn: part.canonicalMpn,
        brand: part.canonicalBrand,
        source: 'chipdip',
        timestamp: startMs,
      })

      try {
        const result = await client.searchMpn(part.canonicalMpn, part.canonicalBrand)
        const durationMs = Date.now() - startMs
        const missStatus: EnrichmentItemStatus = isLcscAvailable()
          ? 'chipdip_not_found'
          : 'lcsc_not_found'

        if (result) {
          const persisted = await persistBeforeStatusUpdate(part, result, logger)
          if (!persisted) continue
          await journal.updateStatus(runId, part.canonicalBrand, part.canonicalMpn, 'chipdip_done')

          logger.info({
            event: 'chipdip_found',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'chipdip',
            durationMs,
          })

          bus.emit('mpn_completed', {
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'chipdip',
            status: 'chipdip_done',
            durationMs,
            timestamp: Date.now(),
          })
        } else {
          await journal.updateStatus(
            runId,
            part.canonicalBrand,
            part.canonicalMpn,
            missStatus,
          )

          logger.info({
            event: 'chipdip_not_found',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'chipdip',
            durationMs,
          })

          bus.emit('mpn_completed', {
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'chipdip',
            status: missStatus,
            durationMs,
            timestamp: Date.now(),
          })
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        const durationMs = Date.now() - startMs

        // Check if REALLY blocked (403/CAPTCHA) - only exact match from ChipDip client
        if (errorMsg.includes('ChipDip blocked (403/CAPTCHA)')) {
          const blockedStatus: EnrichmentItemStatus = isLcscAvailable()
            ? 'chipdip_blocked'
            : 'lcsc_not_found'
          await journal.updateStatus(
            runId,
            part.canonicalBrand,
            part.canonicalMpn,
            blockedStatus,
            errorMsg,
          )

          logger.warn({
            event: 'chipdip_blocked',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'chipdip',
            durationMs,
            error: errorMsg,
          })

          bus.emit('mpn_completed', {
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'chipdip',
            status: blockedStatus,
            durationMs,
            timestamp: Date.now(),
          })

          const skipped = await journal.skipPendingChipDip(
            runId,
            'ChipDip blocked during run; routed to fallback',
          )
          if (!isLcscAvailable()) {
            await journal.routePendingLcsc(
              runId,
              'lcsc_not_found',
              'LCSC disabled after ChipDip block',
            )
          }
          console.warn(`\n⚠️  ChipDip заблокирован. Передано дальше: ${skipped}`)
          break
        } else {
          // Other errors (network, timeout, etc.) — increment attempts.
          // After 3 failures mark as chipdip_not_found so it moves to LCSC.
          const attempts = await journal.incrementAttempts(
            runId, part.canonicalBrand, part.canonicalMpn,
          )

          if (attempts >= 3) {
            const missStatus: EnrichmentItemStatus = isLcscAvailable()
              ? 'chipdip_not_found'
              : 'lcsc_not_found'
            await journal.updateStatus(
              runId, part.canonicalBrand, part.canonicalMpn,
              missStatus, errorMsg,
            )
            logger.warn({
              event: 'chipdip_max_retries',
              mpn: part.canonicalMpn,
              brand: part.canonicalBrand,
              source: 'chipdip',
              durationMs,
              error: `${attempts} attempts failed, moving to LCSC`,
            })
            bus.emit('mpn_completed', {
              mpn: part.canonicalMpn,
              brand: part.canonicalBrand,
              source: 'chipdip',
              status: missStatus,
              durationMs,
              timestamp: Date.now(),
            })
          } else {
            logger.error({
              event: 'chipdip_error',
              mpn: part.canonicalMpn,
              brand: part.canonicalBrand,
              source: 'chipdip',
              durationMs,
              error: `attempt ${attempts}/3: ${errorMsg}`,
            })
          }
        }
      }

      // Update progress
      await updateProgressStats(runId, journal, progress)
    }
  }
}

/**
 * LCSC processing loop.
 * Processes items with status `chipdip_not_found`.
 */
async function runLcscLoop(
  runId: string,
  journal: StatusJournal,
  client: LcscClient,
  logger: EnrichmentLogger,
  progress: ProgressReporter,
  bus: EnrichmentEvents,
  onBlocked: () => void,
  isShutdown: () => boolean,
): Promise<void> {
  while (!isShutdown()) {
    const batch = await journal.getChipDipNotFound(runId, FETCH_BATCH_SIZE)

    if (batch.length === 0) {
      // Wait for ChipDip to produce more chipdip_not_found items
      await sleep(QUEUE_POLL_INTERVAL_MS)
      const recheck = await journal.getChipDipNotFound(runId, 1)
      if (recheck.length === 0) {
        // Check if ChipDip loop is still running (pending items exist)
        const pending = await journal.getNextBatch(runId, 'pending', 1)
        if (pending.length === 0) break
      }
      continue
    }

    for (const part of batch) {
      if (isShutdown()) break

      const startMs = Date.now()
      bus.emit('mpn_started', {
        mpn: part.canonicalMpn,
        brand: part.canonicalBrand,
        source: 'lcsc',
        timestamp: startMs,
      })

      try {
        const result = await client.searchMpn(part.canonicalMpn, part.canonicalBrand)
        const durationMs = Date.now() - startMs

        if (result) {
          const persisted = await persistBeforeStatusUpdate(part, result, logger)
          if (!persisted) continue
          await journal.updateStatus(runId, part.canonicalBrand, part.canonicalMpn, 'lcsc_done')

          logger.info({
            event: 'lcsc_found',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'lcsc',
            durationMs,
          })

          bus.emit('mpn_completed', {
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'lcsc',
            status: 'lcsc_done',
            durationMs,
            timestamp: Date.now(),
          })
        } else {
          await journal.updateStatus(runId, part.canonicalBrand, part.canonicalMpn, 'lcsc_not_found')

          logger.info({
            event: 'lcsc_not_found',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'lcsc',
            durationMs,
          })

          bus.emit('mpn_completed', {
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'lcsc',
            status: 'lcsc_not_found',
            durationMs,
            timestamp: Date.now(),
          })
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        const durationMs = Date.now() - startMs

        if (err instanceof LcscBlockedError) {
          onBlocked()
          await journal.updateStatus(runId, part.canonicalBrand, part.canonicalMpn, 'lcsc_blocked')

          logger.warn({
            event: 'lcsc_blocked',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'lcsc',
            durationMs,
            error: errorMsg,
          })

          bus.emit('mpn_completed', {
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'lcsc',
            status: 'lcsc_blocked',
            durationMs,
            timestamp: Date.now(),
          })

          const skipped = await journal.routePendingLcsc(
            runId,
            'lcsc_blocked',
            errorMsg,
          )
          console.warn(`\n⚠️  LCSC заблокирован. Передано в Mouser: ${skipped}`)
          break
        } else {
          await journal.updateStatus(
            runId,
            part.canonicalBrand,
            part.canonicalMpn,
            'lcsc_not_found',
            errorMsg,
          )
          logger.error({
            event: 'lcsc_error_fallback',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'lcsc',
            durationMs,
            error: errorMsg,
          })
        }
      }

      // Update progress
      await updateProgressStats(runId, journal, progress)
    }
  }
}

/**
 * Mouser processing loop.
 * Processes items with status `lcsc_not_found`.
 */
async function runMouserLoop(
  runId: string,
  journal: StatusJournal,
  client: MouserClient,
  logger: EnrichmentLogger,
  progress: ProgressReporter,
  config: OrchestratorConfig,
  bus: EnrichmentEvents,
  isShutdown: () => boolean,
): Promise<void> {
  while (!isShutdown()) {
    // Check quota before processing
    if (client.isQuotaExhausted()) {
      logger.warn({ event: 'mouser_quota_exhausted', source: 'mouser' })
      console.log(`\n⏸️  Mouser квота исчерпана (1000/день). Ожидание следующего дня...`)

      // Wait until next day (check every 5 minutes)
      while (!isShutdown() && client.isQuotaExhausted()) {
        await sleep(5 * 60 * 1000)
      }
      if (isShutdown()) break
    }

    const batch = await journal.getLcscNotFound(runId, FETCH_BATCH_SIZE)

    if (batch.length === 0) {
      // Wait for LCSC to produce more lcsc_not_found items
      await sleep(QUEUE_POLL_INTERVAL_MS)
      const recheck = await journal.getLcscNotFound(runId, 1)
      if (recheck.length === 0) {
        // Check if upstream loops are still running
        const chipdipPending = await journal.getNextBatch(runId, 'pending', 1)
        const lcscPending = await journal.getChipDipNotFound(runId, 1)
        if (chipdipPending.length === 0 && lcscPending.length === 0) break
      }
      continue
    }

    for (const part of batch) {
      if (isShutdown()) break

      // Check quota before each request
      if (client.isQuotaExhausted()) {
        break
      }

      const startMs = Date.now()
      bus.emit('mpn_started', {
        mpn: part.canonicalMpn,
        brand: part.canonicalBrand,
        source: 'mouser',
        timestamp: startMs,
      })

      try {
        const result = await client.searchByPartNumber(part.canonicalMpn, part.canonicalBrand)
        const durationMs = Date.now() - startMs

        if (result) {
          const persisted = await persistBeforeStatusUpdate(part, result, logger)
          if (!persisted) continue
          await journal.updateStatus(runId, part.canonicalBrand, part.canonicalMpn, 'mouser_done')

          logger.info({
            event: 'mouser_found',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'mouser',
            durationMs,
          })

          bus.emit('mpn_completed', {
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'mouser',
            status: 'mouser_done',
            durationMs,
            timestamp: Date.now(),
          })
        } else {
          // Never invent an empty manufacturer for an MPN-only miss.
          if (hasResolvedManufacturer(part, null)) {
            const persisted = await persistBeforeStatusUpdate(part, null, logger)
            if (!persisted) continue
          }
          await journal.updateStatus(runId, part.canonicalBrand, part.canonicalMpn, 'mouser_not_found')

          logger.info({
            event: 'mouser_not_found',
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'mouser',
            durationMs,
          })

          bus.emit('mpn_completed', {
            mpn: part.canonicalMpn,
            brand: part.canonicalBrand,
            source: 'mouser',
            status: 'mouser_not_found',
            durationMs,
            timestamp: Date.now(),
          })
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        const durationMs = Date.now() - startMs

        if (err instanceof QuotaExhaustedError) {
          logger.warn({
            event: 'mouser_quota_exhausted',
            source: 'mouser',
            durationMs,
          })
          bus.emit('mouser_quota_used', {
            used: 1000,
            limit: 1000,
            timestamp: Date.now(),
          })
          break
        }

        await journal.updateStatus(
          runId,
          part.canonicalBrand,
          part.canonicalMpn,
          'mouser_failed',
          errorMsg,
        )

        logger.error({
          event: 'mouser_error',
          mpn: part.canonicalMpn,
          brand: part.canonicalBrand,
          source: 'mouser',
          durationMs,
          error: errorMsg,
        })

        bus.emit('mpn_completed', {
          mpn: part.canonicalMpn,
          brand: part.canonicalBrand,
          source: 'mouser',
          status: 'mouser_failed',
          durationMs,
          timestamp: Date.now(),
        })
      }

      // Update progress
      await updateProgressStats(runId, journal, progress)
    }
  }
}

/**
 * Persists a source result before advancing its journal state.
 *
 * This keeps the item retryable when Supabase is temporarily unavailable.
 * Advancing the journal first can lose the in-memory result if another
 * parallel source loop aborts the run.
 */
async function persistBeforeStatusUpdate(
  identity: PartIdentity,
  result: EnrichmentResult | null,
  logger: EnrichmentLogger,
): Promise<boolean> {
  try {
    const persisted = await persistBatch([{ identity, result }])
    if (persisted.failed > 0) {
      logger.error({
        event: 'persist_error',
        mpn: identity.canonicalMpn,
        brand: identity.canonicalBrand,
        error: persisted.errors.map((item) => item.error).join('; '),
      })
      return false
    }
    return true
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logger.error({
      event: 'persist_error',
      mpn: identity.canonicalMpn,
      brand: identity.canonicalBrand,
      error: errorMsg,
    })
    return false
  }
}

/**
 * Finalizer loop — runs when Mouser is disabled. Picks up MPNs that
 * exhausted ChipDip and LCSC (status `lcsc_not_found`), persists a stub
 * Product entry so the item exists in the catalogue, and promotes the
 * journal status to `unresolved`. Without this loop those MPNs would sit
 * forever in `lcsc_not_found` and the catalog would silently drop them.
 */
async function runUnresolvedFinalizerLoop(
  runId: string,
  journal: StatusJournal,
  logger: EnrichmentLogger,
  progress: ProgressReporter,
  bus: EnrichmentEvents,
  isShutdown: () => boolean,
): Promise<void> {
  while (!isShutdown()) {
    const batch = await journal.getLcscNotFound(runId, FETCH_BATCH_SIZE)

    if (batch.length === 0) {
      await sleep(QUEUE_POLL_INTERVAL_MS)
      const recheck = await journal.getLcscNotFound(runId, 1)
      if (recheck.length === 0) {
        const chipdipPending = await journal.getNextBatch(runId, 'pending', 1)
        const lcscPending = await journal.getChipDipNotFound(runId, 1)
        if (chipdipPending.length === 0 && lcscPending.length === 0) break
      }
      continue
    }

    for (const part of batch) {
      if (isShutdown()) break
      if (hasResolvedManufacturer(part, null)) {
        const persisted = await persistBeforeStatusUpdate(part, null, logger)
        if (!persisted) continue
      }
      await journal.updateStatus(
        runId, part.canonicalBrand, part.canonicalMpn, 'unresolved',
      )
      logger.info({
        event: 'finalized_unresolved',
        mpn: part.canonicalMpn,
        brand: part.canonicalBrand,
      })
      bus.emit('mpn_completed', {
        mpn: part.canonicalMpn,
        brand: part.canonicalBrand,
        source: 'lcsc',
        status: 'unresolved',
        durationMs: 0,
        timestamp: Date.now(),
      })

      await updateProgressStats(runId, journal, progress)
    }
  }
}

/**
 * Updates progress reporter with current stats from journal.
 * Also updates ImportProgress record in database.
 */
async function updateProgressStats(
  runId: string,
  journal: StatusJournal,
  progress: ProgressReporter,
): Promise<void> {
  try {
    const stats = await journal.getStats(runId)
    const mouserQuota = await journal.getMouserQuotaToday()

    progress.update({
      chipdipDone: stats.chipdip_done ?? 0,
      lcscDone: stats.lcsc_done ?? 0,
      mouserDone: stats.mouser_done ?? 0,
      unresolved: (stats.mouser_not_found ?? 0) + (stats.unresolved ?? 0),
      blocked: (stats.chipdip_blocked ?? 0) + (stats.lcsc_blocked ?? 0),
      mouserQuota,
    })

    // Update ImportProgress in database
    const importedProducts = (stats.chipdip_done ?? 0) + (stats.lcsc_done ?? 0) + (stats.mouser_done ?? 0)
    const failedProducts =
      (stats.mouser_not_found ?? 0) +
      (stats.mouser_failed ?? 0) +
      (stats.mouser_brand_mismatch ?? 0) +
      (stats.unresolved ?? 0)

    await prisma.importProgress.update({
      where: { id: runId },
      data: {
        importedProducts,
        failedProducts,
      },
    })
  } catch {
    // Non-critical — silently ignore stats fetch failures
  }
}
