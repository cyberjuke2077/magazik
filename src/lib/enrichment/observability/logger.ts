/**
 * Enrichment Logger
 *
 * Structured JSON logger for the enrichment pipeline.
 * Writes JSON Lines to `./logs/enrichment-YYYY-MM-DD.log`.
 * Also outputs human-friendly format to console.
 * Masks secrets (API keys, proxy passwords) after first 4 chars.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

export interface LogEntry {
  mpn?: string
  brand?: string
  source?: string
  event: string
  durationMs?: number
  error?: string
  proxyN?: number
  step?: string
}

export interface EnrichmentLogger {
  info(data: LogEntry): void
  warn(data: LogEntry): void
  error(data: LogEntry): void
}

export interface CreateLoggerOptions {
  logDir?: string
  silent?: boolean
}

/** Patterns that indicate a value is a secret (API key, password, token) */
const SECRET_PATTERNS = [
  /^[a-f0-9]{8}-[a-f0-9]{4}-/i, // UUID-like API keys
  /^[a-z0-9]{20,}/i, // Long alphanumeric tokens
  /password/i,
  /apikey/i,
  /secret/i,
]

/**
 * Masks a value if it looks like a secret: shows first 4 chars + ***.
 */
function maskIfSecret(value: string): string {
  if (value.length <= 4) return value

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(value)) {
      return value.slice(0, 4) + '***'
    }
  }

  // Also mask if value contains known proxy password patterns
  if (value.includes('@') && value.includes(':')) {
    // Looks like a proxy URL with credentials
    return value.replace(/:([^:@]{4})[^:@]*@/, ':$1***@')
  }

  return value
}

/**
 * Recursively masks secret values in a log entry.
 */
function maskSecrets(entry: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(entry)) {
    if (value === undefined || value === null) continue

    if (typeof value === 'string') {
      // Mask known secret field names
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('key') ||
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token')
      ) {
        masked[key] = value.length > 4 ? value.slice(0, 4) + '***' : '***'
      } else {
        masked[key] = maskIfSecret(value)
      }
    } else {
      masked[key] = value
    }
  }

  return masked
}

/**
 * Formats a log entry for human-friendly console output.
 */
function formatConsole(level: string, entry: LogEntry): string {
  const time = new Date().toLocaleTimeString('ru-RU', { hour12: false })
  const parts: string[] = [`[${time}]`, level.toUpperCase().padEnd(5)]

  if (entry.source) parts.push(`[${entry.source}]`)
  if (entry.mpn) parts.push(entry.mpn)
  parts.push(entry.event)
  if (entry.durationMs !== undefined) parts.push(`(${entry.durationMs}ms)`)
  if (entry.error) parts.push(`ERROR: ${entry.error}`)

  return parts.join(' ')
}

/**
 * Creates a structured JSON logger for the enrichment pipeline.
 *
 * Accepts either a legacy string `logDir` or an options object with
 * `logDir` and `silent`. When `silent: true`, console output is suppressed
 * but file output (`fs.appendFileSync`) continues unchanged.
 *
 * @param options - Either a legacy string `logDir` or `CreateLoggerOptions`.
 * @returns EnrichmentLogger instance
 */
export function createLogger(options?: CreateLoggerOptions | string): EnrichmentLogger {
  const resolved: CreateLoggerOptions =
    typeof options === 'string'
      ? { logDir: options, silent: false }
      : { logDir: options?.logDir, silent: options?.silent ?? false }

  const dir = resolved.logDir ?? path.resolve(process.cwd(), 'logs')
  const silent = resolved.silent ?? false

  // Ensure log directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const today = new Date().toISOString().slice(0, 10)
  const logFile = path.join(dir, `enrichment-${today}.log`)

  function writeLog(level: string, entry: LogEntry): void {
    const timestamp = new Date().toISOString()

    const record = maskSecrets({
      timestamp,
      level,
      ...entry,
    })

    // Write JSON line to file (always, regardless of silent flag)
    const line = JSON.stringify(record) + '\n'
    fs.appendFileSync(logFile, line, 'utf-8')

    // Console output (suppressed in silent mode)
    if (silent) return

    const consoleMsg = formatConsole(level, entry)
    if (level === 'error') {
      console.error(consoleMsg)
    } else if (level === 'warn') {
      console.warn(consoleMsg)
    } else {
      console.log(consoleMsg)
    }
  }

  return {
    info(data: LogEntry): void {
      writeLog('info', data)
    },
    warn(data: LogEntry): void {
      writeLog('warn', data)
    },
    error(data: LogEntry): void {
      writeLog('error', data)
    },
  }
}
