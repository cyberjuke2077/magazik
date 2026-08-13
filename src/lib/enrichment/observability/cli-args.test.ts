import { describe, expect, it } from 'vitest'

import { CliUsageError, parseRunArgs } from './cli-args'

describe('parseRunArgs', () => {
  it('parses a positive trial limit', () => {
    expect(parseRunArgs(['node', 'enrichment-run.ts', '--limit', '3'])).toMatchObject({
      limit: 3,
    })
  })

  it('rejects an invalid trial limit', () => {
    expect(() => parseRunArgs(['node', 'enrichment-run.ts', '--limit', '0'])).toThrow(
      CliUsageError,
    )
  })

  it('parses an explicit force refresh', () => {
    expect(parseRunArgs(['node', 'enrichment-run.ts', '--force-refresh'])).toMatchObject({
      forceRefresh: true,
    })
  })

  it('parses a fast pass without ChipDip', () => {
    expect(parseRunArgs(['node', 'enrichment-run.ts', '--skip-chipdip'])).toMatchObject({
      skipChipdip: true,
    })
  })
})
