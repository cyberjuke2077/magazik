/**
 * Progress Reporter
 *
 * Tracks and reports enrichment pipeline progress.
 * - Updates ImportProgress in DB every 30 seconds
 * - Prints console summary every 60 seconds
 * - Generates final report on completion
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

import { prisma } from '../../prisma'

export interface ProgressStats {
  chipdipDone: number
  lcscDone: number
  mouserDone: number
  unresolved: number
  blocked: number
  mouserQuota: number
}

export interface ProgressReporter {
  start(runId: string, total: number): void
  update(stats: ProgressStats): void
  stop(): void
}

export interface CreateProgressReporterOptions {
  silentConsole?: boolean
}

/** DB update interval: 30 seconds */
const DB_UPDATE_INTERVAL_MS = 30_000

/** Console summary interval: 60 seconds */
const CONSOLE_INTERVAL_MS = 60_000

/**
 * Formats seconds into HH:MM:SS string.
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour12: false })
}

/**
 * Creates a progress reporter that tracks enrichment pipeline progress.
 *
 * @param options - Optional behavior flags. `silentConsole: true` suppresses
 *   the 60-second console summary while keeping the 30-second DB update active.
 * @returns ProgressReporter instance
 */
export function createProgressReporter(
  options?: CreateProgressReporterOptions,
): ProgressReporter {
  const silentConsole = options?.silentConsole ?? false

  let runId: string | null = null
  let total = 0
  let startTime: Date | null = null
  let lastStats: ProgressStats = {
    chipdipDone: 0,
    lcscDone: 0,
    mouserDone: 0,
    unresolved: 0,
    blocked: 0,
    mouserQuota: 0,
  }

  let dbInterval: ReturnType<typeof setInterval> | null = null
  let consoleInterval: ReturnType<typeof setInterval> | null = null

  /**
   * Calculates total processed items from stats.
   */
  function getProcessed(): number {
    return (
      lastStats.chipdipDone +
      lastStats.lcscDone +
      lastStats.mouserDone +
      lastStats.unresolved
    )
  }

  /**
   * Calculates processing speed (items per minute).
   */
  function getSpeed(): number {
    if (!startTime) return 0
    const elapsedMinutes = (Date.now() - startTime.getTime()) / 60_000
    if (elapsedMinutes < 0.1) return 0
    return Math.round(getProcessed() / elapsedMinutes)
  }

  /**
   * Updates ImportProgress record in the database.
   */
  async function updateDb(): Promise<void> {
    if (!runId) return

    const processed = getProcessed()
    const speed = getSpeed()
    const remaining = total - processed
    const eta = speed > 0 ? Math.round((remaining / speed) * 60) : null

    try {
      await prisma.importProgress.update({
        where: { id: runId },
        data: {
          status: 'running',
          totalProducts: total,
          importedProducts: processed,
          failedProducts: lastStats.unresolved,
          importSpeed: speed > 0 ? speed : null,
          estimatedTimeRemaining: eta,
          updatedAt: new Date(),
        },
      })
    } catch {
      // Silently ignore DB update failures — non-critical
    }
  }

  /**
   * Prints human-friendly console summary.
   * Format: [HH:MM:SS] Обработано X/Y | Z/мин | ChipDip ✓A | LCSC ✓B | Mouser ✓C/1000 | unresolved D
   */
  function printConsoleSummary(): void {
    if (silentConsole) return

    const now = new Date()
    const processed = getProcessed()
    const speed = getSpeed()

    const parts = [
      `[${formatTime(now)}]`,
      `Обработано ${processed}/${total}`,
      `${speed}/мин`,
      `ChipDip ✓${lastStats.chipdipDone}`,
      `LCSC ✓${lastStats.lcscDone}`,
      `Mouser ✓${lastStats.mouserDone}/${1000}`,
      `unresolved ${lastStats.unresolved}`,
    ]

    if (lastStats.blocked > 0) {
      parts.push(`blocked ${lastStats.blocked}`)
    }

    console.log(parts.join(' | '))
  }

  return {
    start(id: string, totalItems: number): void {
      runId = id
      total = totalItems
      startTime = new Date()

      // Start DB update interval (every 30s)
      dbInterval = setInterval(() => {
        void updateDb()
      }, DB_UPDATE_INTERVAL_MS)

      // Start console summary interval (every 60s)
      consoleInterval = setInterval(() => {
        printConsoleSummary()
      }, CONSOLE_INTERVAL_MS)
    },

    update(stats: ProgressStats): void {
      lastStats = { ...stats }
    },

    stop(): void {
      if (dbInterval) {
        clearInterval(dbInterval)
        dbInterval = null
      }
      if (consoleInterval) {
        clearInterval(consoleInterval)
        consoleInterval = null
      }

      // Final DB update
      void updateDb()

      // Print final summary
      printConsoleSummary()

      // Generate final report
      if (runId) {
        generateFinalReport()
      }
    },
  }

  /**
   * Generates final report JSON file.
   */
  function generateFinalReport(): void {
    const logsDir = path.resolve(process.cwd(), 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    const today = new Date().toISOString().slice(0, 10)
    const reportPath = path.join(logsDir, `enrichment-report-${today}.json`)

    const report = {
      runId,
      completedAt: new Date().toISOString(),
      total,
      processed: getProcessed(),
      speed: getSpeed(),
      stats: lastStats,
      durationMinutes: startTime
        ? Math.round((Date.now() - startTime.getTime()) / 60_000)
        : 0,
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
    console.log(`\n📊 Отчёт сохранён: ${reportPath}`)
  }
}
