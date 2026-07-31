/**
 * Browser Registry
 *
 * Tracks all active CloakBrowser/Chromium instances launched by the enrichment
 * pipeline and ensures they are closed on process exit.
 *
 * Why this is needed:
 * - cloakbrowser spawns Chromium as a child process.
 * - If the Node process exits before `browser.close()` is called (crash,
 *   uncaught exception, hard kill), the Chromium child becomes orphaned and
 *   keeps consuming CPU/RAM on the host.
 * - This module provides a single place to track every Browser handle and
 *   force-close them via signal handlers and process.on('exit').
 *
 * Usage:
 * - Call `registerBrowser(browser)` right after launching.
 * - Call `unregisterBrowser(browser)` after a clean `browser.close()`.
 * - Call `installExitHandlers()` once at process startup (orchestrator).
 */

import { execSync } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import type { Browser } from 'playwright-core'

/**
 * Playwright's `Browser` class exposes `process()` at runtime (returns the
 * underlying Chromium child process) but the public type definitions in
 * `playwright-core` only declare it on `BrowserServer`/`ElectronApplication`.
 * We narrow via this helper to avoid sprinkling casts at every call site.
 */
type BrowserWithProcess = Browser & { process?: () => ChildProcess | null }

function getBrowserProcess(browser: Browser): ChildProcess | null {
  const candidate = (browser as BrowserWithProcess).process
  if (typeof candidate !== 'function') return null
  try {
    return candidate.call(browser) ?? null
  } catch {
    return null
  }
}

/**
 * Snapshot of every live process: pid → { ppid, pgid, command }.
 * One `ps -eo` call so the cost is bounded even on large hosts.
 */
interface PsRow {
  ppid: number
  pgid: number
  command: string
}

function snapshotProcessTable(): Map<number, PsRow> {
  const table = new Map<number, PsRow>()
  let out = ''
  try {
    out = execSync('ps -eo pid=,ppid=,pgid=,command=', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 16 * 1024 * 1024,
    }).toString()
  } catch {
    return table
  }
  for (const line of out.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    // pid ppid pgid command...
    const match = trimmed.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/)
    if (!match) continue
    const pid = Number.parseInt(match[1], 10)
    const ppid = Number.parseInt(match[2], 10)
    const pgid = Number.parseInt(match[3], 10)
    const command = match[4]
    if (!Number.isFinite(pid) || pid <= 0) continue
    table.set(pid, { ppid, pgid, command })
  }
  return table
}

/**
 * Returns true when `pid` has `rootPid` somewhere in its parent chain. Walks
 * ppid links in `table` up to a depth limit so a corrupt cycle cannot loop
 * forever.
 */
function isDescendantOf(pid: number, rootPid: number, table: Map<number, PsRow>): boolean {
  let cursor = pid
  for (let depth = 0; depth < 64; depth++) {
    const row = table.get(cursor)
    if (!row) return false
    if (row.ppid === rootPid) return true
    if (row.ppid <= 1) return false
    cursor = row.ppid
  }
  return false
}

/**
 * Snapshot of every Chromium/cloakbrowser pid alive at module load. Anything
 * that appears in a later snapshot but is missing here was spawned during
 * this Node process's lifetime — i.e. is ours to kill.
 *
 * Captured eagerly at module evaluation, before any browser is launched.
 * If browser-registry is imported lazily after Chromium has already started,
 * this set will include those pids and they'll be (correctly) excluded.
 */
const chromiumBaseline: Set<number> = (() => {
  const table = snapshotProcessTable()
  const baseline = new Set<number>()
  for (const [pid, row] of table) {
    if (/chrom|cloakbrowser/i.test(row.command)) baseline.add(pid)
  }
  return baseline
})()

/**
 * Tree-kill catch-all: SIGKILLs every Chromium/cloakbrowser process that
 * was spawned by this Node process.
 *
 * Why: cloakbrowser wraps playwright-core in a way that hides the underlying
 * Chromium child process — `browser.process()` returns null. Worse,
 * cloakbrowser may launch chromium with `detached: true` (and possibly
 * `setsid`), which removes it from the Node process's direct descendant tree
 * AND from the shared process group. We use three orthogonal signals to
 * decide ownership:
 *   1. Process is a transitive descendant of our pid (ppid chain).
 *   2. Process shares our process group id.
 *   3. Process is a Chromium pid that did NOT exist at module load.
 * Any one match is enough — all three independently miss in some cloakbrowser
 * configurations, but together they reliably cover what we launched.
 *
 * Returns the count of pids that were actually signalled.
 */
function killChromiumDescendants(): number {
  const table = snapshotProcessTable()
  if (table.size === 0) return 0

  const myPid = process.pid
  const myPgid = table.get(myPid)?.pgid ?? 0

  let killed = 0
  for (const [pid, row] of table) {
    if (pid === myPid) continue
    if (!/chrom|cloakbrowser/i.test(row.command)) continue
    const inTree = isDescendantOf(pid, myPid, table)
    const inGroup = myPgid > 0 && row.pgid === myPgid
    const newSinceLoad = !chromiumBaseline.has(pid)
    if (!inTree && !inGroup && !newSinceLoad) continue
    try {
      process.kill(pid, 'SIGKILL')
      killed++
    } catch {
      // already dead or no permission
    }
  }
  return killed
}

/** All currently active browser instances. */
const activeBrowsers = new Set<Browser>()

let exitHandlersInstalled = false

/**
 * Module-level flag tracking whether `shutdownWithCleanup` is already in
 * progress. Used to make subsequent calls idempotent — the second call
 * tightens timeouts and skips the in-flight wait so a re-entered shutdown
 * (e.g. SIGTERM during SIGINT cleanup) cannot stall the process.
 */
let isShuttingDown = false

/**
 * Adds a browser instance to the registry so it can be force-closed on exit.
 */
export function registerBrowser(browser: Browser): void {
  activeBrowsers.add(browser)
}

/**
 * Removes a browser instance from the registry. Call after a clean close.
 */
export function unregisterBrowser(browser: Browser): void {
  activeBrowsers.delete(browser)
}

/**
 * Returns the current count of tracked browsers (for diagnostics).
 */
export function getActiveBrowserCount(): number {
  return activeBrowsers.size
}

/**
 * Resolves after the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Closes every tracked browser with a per-browser timeout. Browsers that do
 * not finish closing within `timeoutMs` are force-killed via SIGKILL on the
 * underlying Chromium child process (when a pid is available).
 *
 * Idempotent and exception-free: errors from `browser.close()` are logged via
 * `console.warn` but never re-thrown.
 */
export async function closeAllBrowsers(timeoutMs = 5000): Promise<void> {
  const browsers = Array.from(activeBrowsers)
  activeBrowsers.clear()

  // Eager catch-all: cloakbrowser hides the chromium child process behind
  // playwright-core, so the per-browser SIGKILL after the timeout race below
  // is a no-op. Worse, if our parent (npm/tsx) tears the Node process down
  // mid-shutdown, the tree-kill at the END of this function never runs and
  // chromium descendants leak. Do a synchronous tree-kill UP FRONT so the
  // chromium pids are signalled before any await.
  try {
    const killedEarly = killChromiumDescendants()
    if (killedEarly > 0) {
      console.warn(
        `[browser-registry] eager tree-kill terminated ${killedEarly} chromium descendant(s)`,
      )
    }
  } catch (err) {
    console.warn('[browser-registry] eager tree-kill failed:', err)
  }

  type RaceOutcome = 'closed' | 'timeout'

  const races = browsers.map((browser) => {
    const closePromise = browser
      .close()
      .then<RaceOutcome>(() => 'closed')
      .catch((err: unknown): RaceOutcome => {
        console.warn('[browser-registry] browser.close() failed:', err)
        return 'closed'
      })
    const timeoutPromise = sleep(timeoutMs).then<RaceOutcome>(() => 'timeout')
    return Promise.race([closePromise, timeoutPromise])
  })

  const results = await Promise.allSettled(races)

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled' || result.value !== 'timeout') return
    const browser = browsers[index]
    const proc = getBrowserProcess(browser)
    if (!proc) {
      console.warn('[browser-registry] could not SIGKILL: no pid')
      return
    }
    try {
      proc.kill('SIGKILL')
    } catch (err) {
      console.warn('[browser-registry] SIGKILL failed:', err)
    }
  })

  // Catch-all: cloakbrowser hides the chromium child process, so
  // `getBrowserProcess` returns null and the per-browser SIGKILL above is a
  // no-op. Walk our own descendant tree and kill anything that looks like
  // chromium. Safe to run unconditionally — no descendants means no-op.
  try {
    const killed = killChromiumDescendants()
    if (killed > 0) {
      console.warn(`[browser-registry] tree-kill terminated ${killed} chromium descendant(s)`)
    }
  } catch (err) {
    console.warn('[browser-registry] tree-kill failed:', err)
  }
}

/**
 * Options for {@link shutdownWithCleanup}.
 */
export interface ShutdownWithCleanupOptions {
  /** Diagnostic label (signal name or reason) used in logs. */
  signal?: string
  /** Exit code passed to `process.exit`. Defaults to 0. */
  code?: number
  /** Max time to await in-flight work before forcing close. Defaults to 10_000 ms. */
  inFlightTimeoutMs?: number
  /** Per-browser close timeout. Defaults to 5000 ms. */
  closeTimeoutMs?: number
  /** Optional hook awaited (raced with `inFlightTimeoutMs`) before closing browsers. */
  waitInFlight?: () => Promise<void>
}

/**
 * Unified shutdown pipeline:
 *   1. Optionally race `waitInFlight()` against `inFlightTimeoutMs`.
 *   2. Force-close every tracked browser (with per-browser `closeTimeoutMs`).
 *   3. Call `process.exit(code)`.
 *
 * Idempotent: a second concurrent or subsequent invocation skips the
 * in-flight wait and shortens timeouts to 1000 ms so a re-entered shutdown
 * cannot stall the process.
 */
export async function shutdownWithCleanup(
  opts: ShutdownWithCleanupOptions = {},
): Promise<void> {
  const reentry = isShuttingDown
  isShuttingDown = true

  const code = opts.code ?? 0
  const signal = opts.signal ?? 'shutdown'

  if (reentry) {
    console.error(
      `[browser-registry] shutdownWithCleanup re-entered (${signal}); shortening timeouts`,
    )
    try {
      await closeAllBrowsers(1000)
    } catch (err) {
      console.warn('[browser-registry] closeAllBrowsers failed on re-entry:', err)
    }
    process.exit(code)
    return
  }

  console.error(`[browser-registry] shutdownWithCleanup started: ${signal}`)

  const inFlightTimeoutMs = opts.inFlightTimeoutMs ?? 10_000
  const closeTimeoutMs = opts.closeTimeoutMs ?? 5000

  if (opts.waitInFlight) {
    try {
      await Promise.race([opts.waitInFlight(), sleep(inFlightTimeoutMs)])
    } catch (err) {
      console.warn('[browser-registry] waitInFlight failed:', err)
    }
  }

  try {
    await closeAllBrowsers(closeTimeoutMs)
  } catch (err) {
    console.warn('[browser-registry] closeAllBrowsers failed:', err)
  }

  process.exit(code)
}

/**
 * Synchronous best-effort close used in `process.on('exit')` where async
 * code is not awaited. Sends SIGKILL to the underlying Chromium process
 * via Playwright's public `browser.process()` API, then runs a tree-kill
 * catch-all to terminate any chromium descendants that remained orphaned
 * (e.g. when cloakbrowser hides the child pid).
 */
function syncForceClose(): void {
  for (const browser of activeBrowsers) {
    try {
      const proc = getBrowserProcess(browser)
      if (proc) {
        proc.kill('SIGKILL')
      } else {
        console.warn('[browser-registry] could not SIGKILL: no pid')
      }
    } catch (err) {
      console.warn('[browser-registry] sync SIGKILL failed:', err)
    }
  }
  activeBrowsers.clear()

  try {
    const killed = killChromiumDescendants()
    if (killed > 0) {
      console.warn(`[browser-registry] sync tree-kill terminated ${killed} chromium descendant(s)`)
    }
  } catch (err) {
    console.warn('[browser-registry] sync tree-kill failed:', err)
  }
}

/**
 * Installs process-wide exit handlers that guarantee Chromium child
 * processes are terminated. Idempotent — installs only once.
 */
export function installExitHandlers(): void {
  if (exitHandlersInstalled) return
  exitHandlersInstalled = true

  process.on('uncaughtException', (err) => {
    console.error('[browser-registry] uncaughtException:', err)
    void shutdownWithCleanup({ code: 1, signal: 'uncaughtException' })
  })

  process.on('unhandledRejection', (reason) => {
    console.error('[browser-registry] unhandledRejection:', reason)
    void shutdownWithCleanup({ code: 1, signal: 'unhandledRejection' })
  })

  // Synchronous fallback: even if `activeBrowsers` is empty, cloakbrowser may
  // have left chromium descendants that we never had a handle for. Always run
  // a tree-kill catch-all on exit.
  process.on('exit', () => {
    syncForceClose()
  })
}
