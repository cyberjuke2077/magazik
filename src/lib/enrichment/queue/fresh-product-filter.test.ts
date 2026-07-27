import { describe, expect, it } from 'vitest'

import {
  isFreshCompleteProduct,
  productMemoryKey,
} from './fresh-product-filter'

describe('fresh product memory', () => {
  const cutoff = new Date('2026-01-01T00:00:00.000Z')

  it('matches brand case-insensitively and MPN canonically', () => {
    expect(productMemoryKey('Analog Devices', 'aduc812bsz-reel')).toBe(
      productMemoryKey(' analog devices ', 'ADUC812BSZ-REEL'),
    )
  })

  it('skips only complete products newer than cutoff', () => {
    expect(
      isFreshCompleteProduct(
        {
          mpnNormalized: 'ABC',
          enrichmentStatus: 'complete',
          lastEnrichedAt: new Date('2026-02-01T00:00:00.000Z'),
          manufacturer: { name: 'Brand' },
        },
        cutoff,
      ),
    ).toBe(true)

    expect(
      isFreshCompleteProduct(
        {
          mpnNormalized: 'ABC',
          enrichmentStatus: 'partial',
          lastEnrichedAt: new Date('2026-02-01T00:00:00.000Z'),
          manufacturer: { name: 'Brand' },
        },
        cutoff,
      ),
    ).toBe(false)
  })
})
