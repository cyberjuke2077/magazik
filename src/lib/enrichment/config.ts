import 'dotenv/config'

import { type EnrichmentConfig } from './types'

/**
 * Loads and validates enrichment pipeline configuration from environment variables.
 *
 * Required vars (fail if missing):
 * - `ENRICHMENT_INPUT_DIR` — path to supplier Excel/CSV files
 * - `DATABASE_URL` — PostgreSQL connection string
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
export function loadEnrichmentConfig(): EnrichmentConfig {
  const missing: string[] = []

  const inputDir = process.env.ENRICHMENT_INPUT_DIR
  if (!inputDir) missing.push('ENRICHMENT_INPUT_DIR')

  // Mouser API key is optional — if absent, Mouser source is skipped at runtime.
  const mouserApiKey = process.env.MOUSER_API_KEY ?? ''

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) missing.push('DATABASE_URL')

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

  return {
    inputDir: inputDir!,
    chipdipProxyTemplate,
    chipdipProxyUrl,
    chipdipProxyUserRange,
    chipdipConcurrency,
    mouserApiKey,
    batchSize,
    persistBatchSize,
    databaseUrl: databaseUrl!,
  }
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
