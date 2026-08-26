import 'dotenv/config'

import { type EnrichmentConfig } from './types'
import defaults from '../../../config/enrichment.json'

/**
 * Loads and validates enrichment pipeline configuration from environment variables.
 *
 * Required vars (fail if missing):
 * - `ENRICHMENT_INPUT_DIR` — path to supplier Excel/CSV files
 * - `DATABASE_URL` - PostgreSQL connection string for non-dry runs
 *
 * Optional vars:
 * - `MOUSER_API_KEY` — Mouser Search API key (Mouser source disabled if absent)
 * - `CHIPDIP_PROXY_TEMPLATE` — proxy URL template with `{N}` placeholder (fallback only)
 * - `CHIPDIP_PROXY_URL` — direct proxy URL for ChipDip (fallback only)
 * - `CHIPDIP_PROXY_USER_RANGE` — comma-separated pair `min,max` (default `1,20000`)
 * - `CHIPDIP_CONCURRENCY` — number of CloakBrowser sessions, 1-3 (default `1`)
 * - `ENRICHMENT_BATCH_SIZE` — items per processing batch (default `500`)
 * - `ENRICHMENT_PERSIST_BATCH` — items per DB write transaction (default `50`)
 *
 * @throws Error if required variables are missing or values are invalid
 */
interface LoadEnrichmentConfigOptions {
  requireDatabase?: boolean
}

export function loadEnrichmentConfig(
  options: LoadEnrichmentConfigOptions = {},
): EnrichmentConfig {
  const missing: string[] = []
  const requireDatabase = options.requireDatabase ?? true

  const inputDir = process.env.ENRICHMENT_INPUT_DIR
  if (!inputDir) missing.push('ENRICHMENT_INPUT_DIR')

  // Mouser API key is optional — if absent, Mouser source is skipped at runtime.
  const mouserApiKey = process.env.MOUSER_API_KEY ?? ''

  const databaseUrl = process.env.DATABASE_URL
  if (requireDatabase && !databaseUrl) missing.push('DATABASE_URL')

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please set them in your .env file.',
    )
  }

  const chipdipProxyTemplate = process.env.CHIPDIP_PROXY_TEMPLATE || undefined
  const chipdipProxyUrl = process.env.CHIPDIP_PROXY_URL || undefined

  const chipdipProxyUserRange = parseUserRange(
    process.env.CHIPDIP_PROXY_USER_RANGE || '1,20000',
  )

  const chipdipConcurrency = parseConcurrency(
    process.env.CHIPDIP_CONCURRENCY || '1',
  )

  const batchSize = parsePositiveInt(
    process.env.ENRICHMENT_BATCH_SIZE || '500',
    'ENRICHMENT_BATCH_SIZE',
  )

  const persistBatchSize = parsePositiveInt(
    process.env.ENRICHMENT_PERSIST_BATCH || '50',
    'ENRICHMENT_PERSIST_BATCH',
  )

  const freshnessDays = parseNonNegativeInt(
    process.env.ENRICHMENT_FRESHNESS_DAYS || String(defaults.freshnessDays),
    'ENRICHMENT_FRESHNESS_DAYS',
  )

  const skipFreshProducts =
    process.env.ENRICHMENT_SKIP_FRESH === undefined
      ? defaults.skipFreshProducts
      : parseBoolean(process.env.ENRICHMENT_SKIP_FRESH, 'ENRICHMENT_SKIP_FRESH')

  const chipdipRequestDelayRange = parseDelayRange(
    process.env.CHIPDIP_REQUEST_DELAY_MIN_MS ||
      String(defaults.chipdip.requestDelayMinMs),
    process.env.CHIPDIP_REQUEST_DELAY_MAX_MS ||
      String(defaults.chipdip.requestDelayMaxMs),
    'CHIPDIP_REQUEST_DELAY',
  )

  const chipdipPageDelayRange = parseDelayRange(
    process.env.CHIPDIP_PAGE_DELAY_MIN_MS ||
      String(defaults.chipdip.pageDelayMinMs),
    process.env.CHIPDIP_PAGE_DELAY_MAX_MS ||
      String(defaults.chipdip.pageDelayMaxMs),
    'CHIPDIP_PAGE_DELAY',
  )

  return {
    inputDir: inputDir!,
    chipdipProxyTemplate,
    chipdipProxyUrl,
    chipdipProxyUserRange,
    chipdipConcurrency,
    skipFreshProducts,
    freshnessDays,
    chipdipRequestDelayRange,
    chipdipPageDelayRange,
    mouserApiKey,
    batchSize,
    persistBatchSize,
    ...(databaseUrl && { databaseUrl }),
  }
}

function parseBoolean(raw: string, varName: string): boolean {
  if (raw === '1' || raw.toLowerCase() === 'true') return true
  if (raw === '0' || raw.toLowerCase() === 'false') return false
  throw new Error(`Invalid ${varName}: expected true/false or 1/0, got "${raw}"`)
}

function parseNonNegativeInt(raw: string, varName: string): number {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `Invalid ${varName}: expected non-negative integer, got "${raw}"`,
    )
  }
  return value
}

function parseDelayRange(
  rawMin: string,
  rawMax: string,
  varName: string,
): [number, number] {
  const min = parsePositiveInt(rawMin, `${varName}_MIN_MS`)
  const max = parsePositiveInt(rawMax, `${varName}_MAX_MS`)
  if (max < min) {
    throw new Error(`Invalid ${varName}: max ${max} must be >= min ${min}`)
  }
  return [min, max]
}

/**
 * Parses `CHIPDIP_PROXY_USER_RANGE` as a comma-separated pair of numbers.
 * @example parseUserRange('1,20000') → [1, 20000]
 */
function parseUserRange(raw: string): [number, number] {
  const parts = raw.split(',').map((s) => s.trim())
  if (parts.length !== 2) {
    throw new Error(
      `Invalid CHIPDIP_PROXY_USER_RANGE: expected "min,max", got "${raw}"`,
    )
  }

  const min = Number(parts[0])
  const max = Number(parts[1])

  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
    throw new Error(
      `Invalid CHIPDIP_PROXY_USER_RANGE: min=${parts[0]}, max=${parts[1]}. ` +
      'Both must be non-negative numbers with min <= max.',
    )
  }

  return [min, max]
}

/**
 * Parses and validates `CHIPDIP_CONCURRENCY` (must be 1-3).
 */
function parseConcurrency(raw: string): number {
  const value = Number(raw)

  if (!Number.isInteger(value) || value < 1 || value > 3) {
    throw new Error(
      `Invalid CHIPDIP_CONCURRENCY: expected integer 1-3, got "${raw}"`,
    )
  }

  return value
}

/**
 * Parses a positive integer from string with descriptive error.
 */
function parsePositiveInt(raw: string, varName: string): number {
  const value = Number(raw)

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(
      `Invalid ${varName}: expected positive integer, got "${raw}"`,
    )
  }

  return value
}
