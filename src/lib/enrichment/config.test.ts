import { afterEach, describe, expect, it } from 'vitest'

import { loadEnrichmentConfig } from './config'

const originalInputDir = process.env.ENRICHMENT_INPUT_DIR
const originalDatabaseUrl = process.env.DATABASE_URL

afterEach(() => {
  restoreEnvironmentVariable('ENRICHMENT_INPUT_DIR', originalInputDir)
  restoreEnvironmentVariable('DATABASE_URL', originalDatabaseUrl)
})

describe('loadEnrichmentConfig', () => {
  it('does not require a database URL for an input-only dry run', () => {
    process.env.ENRICHMENT_INPUT_DIR = 'data/trial-supplier'
    delete process.env.DATABASE_URL

    const config = loadEnrichmentConfig({ requireDatabase: false })

    expect(config.inputDir).toBe('data/trial-supplier')
    expect(config.databaseUrl).toBeUndefined()
  })

  it('still requires a database URL for a real enrichment run', () => {
    process.env.ENRICHMENT_INPUT_DIR = 'data/trial-supplier'
    delete process.env.DATABASE_URL

    expect(() => loadEnrichmentConfig()).toThrow(
      'Missing required environment variables: DATABASE_URL',
    )
  })
})

function restoreEnvironmentVariable(
  name: 'ENRICHMENT_INPUT_DIR' | 'DATABASE_URL',
  value: string | undefined,
): void {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}
