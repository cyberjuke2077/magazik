/**
 * Bug A Exploration Test (BEFORE fix) — bug-condition methodology.
 *
 * GOAL: подтвердить баг A — после SIGINT/SIGTERM в Node-процессе обогатителя
 * остаются orphaned Chromium/cloakbrowser-процессы, потому что in-flight
 * `searchMpn` (page.goto + sleep(getJitterMs) 20–45 сек) удерживает event-loop
 * до второго SIGINT и/или `closeAllBrowsers()` не успевает / зависает на CDP.
 *
 * EXPECTED OUTCOME: тест ПАДАЕТ на текущем (unfixed) коде. Падение фиксирует
 * counterexample (orphan-pid'ы и `ps -fp <pid>`).
 *
 * Чтобы воспроизвести баг, нужно реально войти в in-flight операцию,
 * поэтому тест:
 *   1. Создаёт временный input-каталог с CSV из 2 MPN (без заголовков —
 *      auto-detect по MPN_PATTERN /^[A-Za-z][A-Za-z0-9\-+/.]{2,29}$/).
 *   2. Перезаписывает ENRICHMENT_INPUT_DIR в env child-процесса.
 *   3. Запускает обогатитель с `--skip-mouser --skip-lcsc`.
 *   4. Ждёт `chipdip_healthcheck_ok`, потом ещё IN_FLIGHT_DELAY_MS чтобы
 *      гарантированно быть внутри `searchMpn` (page.goto к chipdip.ru).
 *   5. Шлёт SIGINT (или SIGTERM, или двойной SIGINT) на процесс-группу.
 *   6. Ждёт exit (или принудительно убивает по таймауту).
 *   7. Сравнивает кроссплатформенные снимки процессов до/после.
 *
 * Запуск:
 *   npm run test:integration -- tests/integration/enrichment-shutdown.test.ts
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.9
 *
 * ============================================================================
 * RECORDED COUNTEREXAMPLES (UNFIXED code, macOS, run на 2025-XX-XX)
 * ============================================================================
 *
 * SIGINT during in-flight searchMpn:
 *   exit: code=null, signal=SIGINT, durationMs=16_429, reachedInFlight=true
 *   orphan pids: [49611, 49613, 49614, 49615, 49618, 49619, 49621]   (7 orphans)
 *   stdout/stderr tail:
 *     [chipdip] chipdip_healthcheck_ok
 *     ✅ ChipDip health-check пройден
 *     ⚡ Запуск параллельных очередей...
 *     ⚠️  Получен SIGINT, завершаем текущие операции...
 *     [SIGINT] shutdown_requested
 *     [chipdip] LM7805 chipdip_error (15193ms)
 *       ERROR: page.goto: Target page, context or browser has been closed
 *       Call log:
 *         - navigating to "https://www.chipdip.ru/product/lm7805-...",
 *           waiting until "networkidle"
 *
 * double-SIGINT:
 *   orphan pids: [49393, 49399, 49400, 49401, 49407, 49409, 49410]   (7 orphans)
 *
 * property test (fc.constantFrom('SIGINT'|'SIGTERM') × fc.constantFrom(1|2),
 * numRuns: 3) — failed after 1 test, counterexample: ["SIGINT", 1]:
 *   orphan pids: [49485, 49487, 49488, 49489, 49491, 49493, 49495]   (7 orphans)
 *
 * Анализ root cause (подтверждённый этим прогоном):
 *   1. `handleShutdown(signal)` в orchestrator только выставляет
 *      `shutdownRequested = true` — он не дожидается завершения in-flight
 *      операций и не вызывает `closeAllBrowsers()`.
 *   2. In-flight `page.goto` + последующий `sleep(getJitterMs())` 20–45 сек
 *      удерживают event-loop. Loop проверяет `isShutdown()` только перед
 *      следующей итерацией.
 *   3. Vitest принудительно убивает child-процесс по своему таймауту
 *      (signal=SIGINT, exitCode=null), не дав `finally`-блоку
 *      `runEnrichmentPipeline` дойти до `closeAllBrowsers()`.
 *   4. `installExitHandlers` подписывается только на uncaughtException /
 *      unhandledRejection / process.on('exit'), но не на SIGINT/SIGTERM —
 *      они полностью отданы orchestrator-у, у которого pipeline для них
 *      отсутствует.
 *   5. `syncForceClose` в `process.on('exit')` обращается к приватному
 *      `(browser as unknown as {_process})._process` — этого поля нет в
 *      текущей версии playwright-core/cloakbrowser, SIGKILL никуда не уходит.
 *
 * После фикса (tasks 7–8) ожидаем: orphan pids = [], exitCode in {0, 130},
 * durationMs ≤ in_flight_timeout (10 с) + close_timeout (5 с) + запас.
 * ============================================================================
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  describeProcessPids,
  diffOrphans,
  snapshotChromiumPids,
} from './helpers/process-snapshot'

const REPO_ROOT = resolve(__dirname, '../..')
const ENRICHMENT_SCRIPT = 'src/scripts/enrichment-run.ts'

function npmExecTsx(args: string[]): { command: string; args: string[] } {
  const npmArgs = ['exec', 'tsx', '--', ...args]

  if (process.platform === 'win32') {
    // Аргументы формируются только из внутренних констант теста, без данных пользователя.
    const commandLine = ['npm.cmd', ...npmArgs].join(' ')
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', commandLine],
    }
  }

  return { command: 'npm', args: npmArgs }
}

// `logger.info({ event: 'chipdip_healthcheck_ok' })` — после health-check
// orchestrator идёт в `runChipDipLoop`, где сразу `getNextBatch` → `searchMpn`.
const READY_LOG_MARKER = 'chipdip_healthcheck_ok'

// Тайминги
const READY_TIMEOUT_MS = 120_000
// После healthcheck нужно дождаться, чтобы loop точно вошёл в `await
// client.searchMpn(...)`. searchMpn внутри: page.goto({waitUntil:'networkidle'})
// — это легко 5–15 сек. Берём с запасом.
const IN_FLIGHT_DELAY_MS = 15_000
// Ждём корректного выхода после SIGINT.
const EXIT_TIMEOUT_MS = 60_000

// Реальные MPN — chipdip их ищет. Не критично попадание (любой не-blocked HTTP
// 200 годится), важно что page.goto уйдёт по сети.
const TEST_MPNS = ['LM7805', 'NE555P']

let tmpInputDir: string

beforeAll(() => {
  tmpInputDir = mkdtempSync(join(tmpdir(), 'enrich-shutdown-test-'))
  // CSV без заголовков: col0=MPN, col1=brand. Auto-detect через MPN_PATTERN.
  const csv = TEST_MPNS.map((mpn) => `${mpn},Texas Instruments`).join('\n') + '\n'
  writeFileSync(join(tmpInputDir, 'parts.csv'), csv, 'utf-8')
})

afterAll(() => {
  if (tmpInputDir) {
    rmSync(tmpInputDir, { recursive: true, force: true })
  }
})

interface RunArgs {
  signal: NodeJS.Signals
  doubleSignal?: boolean
}

interface RunResult {
  exitCode: number | null
  exitSignal: NodeJS.Signals | null
  durationMs: number
  stdoutTail: string
  stderrTail: string
  reachedInFlight: boolean
}

/**
 * Запустить обогатитель в child-процессе, дождаться healthcheck,
 * выдержать паузу (внутри searchMpn), послать сигнал, дождаться выхода.
 *
 * `detached: true` → child получает свою process-group, можно слать сигнал
 * по `-pgid`, чтобы зацепить tsx/node, а не только npm-обёртку.
 * На Windows signal-сценарии пропускаются, потому что Node не поддерживает
 * POSIX process groups и graceful SIGINT для дочерних console-процессов.
 */
async function runAndSignal(args: RunArgs): Promise<RunResult> {
  const startedAt = Date.now()
  const invocation = npmExecTsx([ENRICHMENT_SCRIPT, '--skip-mouser', '--skip-lcsc'])
  const child: ChildProcess = spawn(
    invocation.command,
    invocation.args,
    {
      cwd: REPO_ROOT,
      detached: process.platform !== 'win32',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ENRICHMENT_INPUT_DIR: tmpInputDir,
        FORCE_COLOR: '0',
      },
    },
  )

  if (!child.pid) {
    throw new Error('failed to spawn enrichment child process')
  }

  let stdoutBuf = ''
  let stderrBuf = ''
  child.stdout?.setEncoding('utf-8')
  child.stderr?.setEncoding('utf-8')
  child.stdout?.on('data', (chunk: string) => {
    stdoutBuf += chunk
  })
  child.stderr?.on('data', (chunk: string) => {
    stderrBuf += chunk
  })

  let reachedInFlight = false
  try {
    await waitForLog(child, () => stdoutBuf + stderrBuf, READY_LOG_MARKER, READY_TIMEOUT_MS)
    // Ждём, пока loop гарантированно зашёл в page.goto / sleep(jitter).
    await sleep(IN_FLIGHT_DELAY_MS)
    reachedInFlight = true

    sendSignalToGroup(child.pid, args.signal)
    if (args.doubleSignal) {
      await sleep(1_000)
      sendSignalToGroup(child.pid, args.signal)
    }

    const exitInfo = await waitForExit(child, EXIT_TIMEOUT_MS)
    return {
      exitCode: exitInfo.code,
      exitSignal: exitInfo.signal,
      durationMs: Date.now() - startedAt,
      stdoutTail: tail(stdoutBuf, 4000),
      stderrTail: tail(stderrBuf, 4000),
      reachedInFlight,
    }
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      // Если по EXIT_TIMEOUT_MS не вышел — добиваем (это часть bug-condition:
      // unfixed-shutdown подвис на CDP-канале, мы это считаем подтверждением,
      // но для тест-инфраструктуры всё равно нужно почистить).
      try {
        sendSignalToGroup(child.pid, 'SIGKILL')
      } catch {
        /* ignore */
      }
      await sleep(2_000)
    }
  }
}

function sendSignalToGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    // negative pid → процесс-группа (POSIX). На macOS/Linux работает.
    process.kill(-pid, signal)
  } catch {
    try {
      process.kill(pid, signal)
    } catch {
      /* процесс уже умер */
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

function tail(s: string, n: number): string {
  return s.length > n ? s.slice(s.length - n) : s
}

function waitForLog(
  child: ChildProcess,
  getBuffer: () => string,
  marker: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((res, rej) => {
    const start = Date.now()
    const tick = setInterval(() => {
      if (getBuffer().includes(marker)) {
        clearInterval(tick)
        res()
        return
      }
      if (child.exitCode !== null || child.signalCode !== null) {
        clearInterval(tick)
        rej(
          new Error(
            `child exited before "${marker}" appeared\n` +
              `exitCode=${child.exitCode}, signal=${child.signalCode}\n` +
              `--- stdout/stderr tail ---\n${tail(getBuffer(), 2000)}`,
          ),
        )
        return
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(tick)
        rej(
          new Error(
            `timeout waiting for "${marker}" after ${timeoutMs}ms\n` +
              `--- stdout/stderr tail ---\n${tail(getBuffer(), 2000)}`,
          ),
        )
      }
    }, 200)
  })
}

function waitForExit(
  child: ChildProcess,
  timeoutMs: number,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((res) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      res({ code: child.exitCode, signal: child.signalCode })
      return
    }
    const timer = setTimeout(() => {
      res({ code: child.exitCode, signal: child.signalCode })
    }, timeoutMs)
    child.once('exit', (code, signal) => {
      clearTimeout(timer)
      res({ code, signal })
    })
  })
}

/**
 * Дождаться, пока ОС полностью уберёт дочерние процессы из таблицы. На Windows
 * завершение дерева процессов может быть отложено на несколько секунд после
 * exit родителя, поэтому один мгновенный снимок даёт ложные orphan-срабатывания.
 * Постоянный orphan всё равно будет возвращён по истечении ограниченного срока.
 */
async function waitForNoNewChromium(
  before: number[],
  timeoutMs = 10_000,
): Promise<number[]> {
  const deadline = Date.now() + timeoutMs
  let orphans: number[] = []

  do {
    const after = await snapshotChromiumPids()
    orphans = diffOrphans(before, after)
    if (orphans.length === 0) return []
    await sleep(500)
  } while (Date.now() < deadline)

  return orphans
}

function formatOrphanFailure(scenario: string, orphans: number[], result: RunResult): string {
  return (
    `[Bug A] ${scenario}: orphaned Chromium-процессы остались после shutdown.\n` +
    `  orphan pids: ${JSON.stringify(orphans)}\n` +
    `  exit: code=${result.exitCode}, signal=${result.exitSignal}, ` +
    `durationMs=${result.durationMs}, reachedInFlight=${result.reachedInFlight}\n` +
    `  --- stdout tail ---\n${result.stdoutTail}\n` +
    `  --- stderr tail ---\n${result.stderrTail}`
  )
}

const describeSignalShutdown = process.platform === 'win32' ? describe.skip : describe

describeSignalShutdown('enrichment shutdown - Bug A exploration (UNFIXED code)', () => {
  it('SIGINT during in-flight searchMpn leaves no orphaned Chromium processes', async () => {
    const before = await snapshotChromiumPids()
    const result = await runAndSignal({ signal: 'SIGINT' })
    const orphans = await waitForNoNewChromium(before)

    if (orphans.length > 0) {
       
      console.error(
        `[Bug A counterexample] SIGINT scenario\n` +
          `  exitCode=${result.exitCode}, exitSignal=${result.exitSignal}, ` +
          `durationMs=${result.durationMs}, reachedInFlight=${result.reachedInFlight}\n` +
          `  orphan pids=${JSON.stringify(orphans)}\n` +
          `  process info:\n${await describeProcessPids(orphans)}`,
      )
    }

    expect(orphans, formatOrphanFailure('SIGINT', orphans, result)).toEqual([])
  }, 240_000)

  it('SIGTERM also leaves no orphans', async () => {
    const before = await snapshotChromiumPids()
    const result = await runAndSignal({ signal: 'SIGTERM' })
    const orphans = await waitForNoNewChromium(before)

    if (orphans.length > 0) {
       
      console.error(
        `[Bug A counterexample] SIGTERM scenario\n` +
          `  exitCode=${result.exitCode}, exitSignal=${result.exitSignal}, ` +
          `durationMs=${result.durationMs}\n` +
          `  orphan pids=${JSON.stringify(orphans)}\n` +
          `  process info:\n${await describeProcessPids(orphans)}`,
      )
    }

    expect(orphans, formatOrphanFailure('SIGTERM', orphans, result)).toEqual([])
  }, 240_000)

  it('double SIGINT during in-flight searchMpn still completes shutdown without leaks', async () => {
    const before = await snapshotChromiumPids()
    const result = await runAndSignal({ signal: 'SIGINT', doubleSignal: true })
    const orphans = await waitForNoNewChromium(before)

    if (orphans.length > 0) {
       
      console.error(
        `[Bug A counterexample] double-SIGINT scenario\n` +
          `  exitCode=${result.exitCode}, exitSignal=${result.exitSignal}, ` +
          `durationMs=${result.durationMs}\n` +
          `  orphan pids=${JSON.stringify(orphans)}\n` +
          `  process info:\n${await describeProcessPids(orphans)}`,
      )
    }

    expect(orphans, formatOrphanFailure('double-SIGINT', orphans, result)).toEqual([])
  }, 240_000)

  // Property test: малое число сценариев (signal × mpnsCount), numRuns: 3.
  // Это конкретные failing cases, не множить — интеграционный тест дорогой.
  it('property: SIGINT|SIGTERM × small queues never leak Chromium', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<NodeJS.Signals>('SIGINT', 'SIGTERM'),
        fc.constantFrom(1, 2),
        async (signal, _mpnsCount) => {
          void _mpnsCount
          // _mpnsCount фиксируется в shrink-сценарии для расширенной версии,
          // в текущем тесте очередь — TEST_MPNS длиной 2.
          const before = await snapshotChromiumPids()
          const result = await runAndSignal({ signal })
          const orphans = await waitForNoNewChromium(before)
          if (orphans.length > 0) {
             
            console.error(
              `[Bug A property counterexample] signal=${signal}\n` +
                `  exitCode=${result.exitCode}, durationMs=${result.durationMs}\n` +
                `  orphans=${JSON.stringify(orphans)}\n` +
                `  process info:\n${await describeProcessPids(orphans)}`,
            )
          }
          expect(orphans).toEqual([])
        },
      ),
      { numRuns: 3 },
    )
  }, 900_000)
})

/**
 * Bug A Preservation Tests (BEFORE fix) — observation-first methodology.
 *
 * GOAL: зафиксировать happy-path baseline на текущей (unfixed) реализации F.
 * Утверждаем, что штатное завершение пайплайна (без SIGINT) уже сегодня:
 *  - выходит с кодом 0
 *  - укладывается в бюджет 30 сек
 *  - не оставляет orphan-процессов Chromium
 *
 * Если эти тесты падают на UNFIXED коде — баг A шире, чем мы думаем (orphan'ы
 * остаются даже на штатном exit), и до фикса оркестратора happy-path тоже сломан.
 * Это критичное наблюдение, его нужно эскалировать в дизайн.
 *
 * Используем `--dry-run` (CLI не принимает `--limit`): пайплайн делает import +
 * deduplicate, печатает stats и завершается без обращений к ChipDip/LCSC/Mouser.
 * Дополнительно `--skip-mouser --skip-lcsc` — на случай, если dry-run пути
 * расширятся в будущем.
 *
 * Validates: Requirements 3.1, 3.5, 3.6, 3.7, 3.8, 3.9
 */

const HAPPY_PATH_BUDGET_MS = 30_000

interface HappyPathResult {
  exitCode: number | null
  exitSignal: NodeJS.Signals | null
  durationMs: number
  stdoutTail: string
  stderrTail: string
}

async function runUntilNaturalExit(timeoutMs: number): Promise<HappyPathResult> {
  const startedAt = Date.now()
  const invocation = npmExecTsx([
    ENRICHMENT_SCRIPT,
    '--dry-run',
    '--skip-mouser',
    '--skip-lcsc',
  ])
  const child: ChildProcess = spawn(
    invocation.command,
    invocation.args,
    {
      cwd: REPO_ROOT,
      detached: process.platform !== 'win32',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    },
  )

  if (!child.pid) {
    throw new Error('failed to spawn enrichment child process')
  }

  let stdoutBuf = ''
  let stderrBuf = ''
  child.stdout?.setEncoding('utf-8')
  child.stderr?.setEncoding('utf-8')
  child.stdout?.on('data', (chunk: string) => {
    stdoutBuf += chunk
  })
  child.stderr?.on('data', (chunk: string) => {
    stderrBuf += chunk
  })

  try {
    const exitInfo = await waitForExit(child, timeoutMs)
    return {
      exitCode: exitInfo.code,
      exitSignal: exitInfo.signal,
      durationMs: Date.now() - startedAt,
      stdoutTail: tail(stdoutBuf, 4000),
      stderrTail: tail(stderrBuf, 4000),
    }
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      try {
        sendSignalToGroup(child.pid, 'SIGKILL')
      } catch {
        /* ignore */
      }
      await sleep(2_000)
    }
  }
}

function formatHappyPathFailure(scenario: string, result: HappyPathResult): string {
  return (
    `[Bug A preservation] ${scenario}: happy-path не уложился в ожидания.\n` +
    `  exit: code=${result.exitCode}, signal=${result.exitSignal}, ` +
    `durationMs=${result.durationMs}\n` +
    `  --- stdout tail ---\n${result.stdoutTail}\n` +
    `  --- stderr tail ---\n${result.stderrTail}`
  )
}

describe('happy-path shutdown', () => {
  it('normal completion exits with code 0 within budget', async () => {
    const result = await runUntilNaturalExit(HAPPY_PATH_BUDGET_MS + 5_000)

    expect(
      result.exitCode,
      formatHappyPathFailure('exit code', result),
    ).toBe(0)
    expect(
      result.durationMs,
      formatHappyPathFailure(`durationMs < ${HAPPY_PATH_BUDGET_MS}`, result),
    ).toBeLessThan(HAPPY_PATH_BUDGET_MS)
  }, 60_000)

  it('normal completion leaves no orphaned processes', async () => {
    const before = await snapshotChromiumPids()

    const result = await runUntilNaturalExit(HAPPY_PATH_BUDGET_MS + 5_000)
    const orphans = await waitForNoNewChromium(before)

    if (orphans.length > 0) {
      const processInfo = await describeProcessPids(orphans)
       
      console.error(
        `[Bug A preservation counterexample] happy-path leaves orphans!\n` +
          `  exitCode=${result.exitCode}, durationMs=${result.durationMs}\n` +
          `  orphans=${JSON.stringify(orphans)}\n` +
          `  process info:\n${processInfo}\n` +
          `  CRITICAL: баг шире — orphan'ы появляются даже без SIGINT`,
      )
    }

    expect(
      orphans,
      formatHappyPathFailure(`orphans=${JSON.stringify(orphans)}`, result),
    ).toEqual([])
  }, 60_000)

  // Property test: несколько мелких happy-path сценариев. mpnsCount пока не управляет
  // очередью (CLI без --limit), но fc.constantFrom фиксирует пространство для
  // будущих расширений. numRuns: 2 — happy-path-сценарии тоже дорогие.
  it('property: small happy-path runs always exit clean', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(1, 2), async (_mpnsCount) => {
        void _mpnsCount
        const before = await snapshotChromiumPids()
        const result = await runUntilNaturalExit(HAPPY_PATH_BUDGET_MS + 5_000)
        const orphans = await waitForNoNewChromium(before)

        expect(result.exitCode).toBe(0)
        expect(result.durationMs).toBeLessThan(HAPPY_PATH_BUDGET_MS)
        expect(orphans).toEqual([])
      }),
      { numRuns: 2 },
    )
  }, 300_000)
})
