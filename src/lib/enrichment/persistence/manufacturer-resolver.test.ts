import { describe, expect, it } from 'vitest'

import { type EnrichmentResult, type PartIdentity } from '../types'
import {
  hasResolvedManufacturer,
  resolveManufacturerName,
} from './manufacturer-resolver'

const identity: PartIdentity = {
  canonicalBrand: '',
  canonicalMpn: 'ADG212AKNZ',
  originalBrand: '',
  originalMpn: 'ADG212AKNZ',
  packages: [],
  dateCodes: [],
}

describe('manufacturer resolution', () => {
  it('uses and normalizes a manufacturer discovered by a source', () => {
    const result: EnrichmentResult = {
      source: 'mouser',
      mpn: 'ADG212AKNZ',
      brand: 'ADI',
    }

    expect(resolveManufacturerName(identity, result)).toBe('Analog Devices')
  })

  it('keeps a manufacturer supplied by the customer', () => {
    const result: EnrichmentResult = {
      source: 'chipdip',
      mpn: 'AD1940YSTZRL',
      brand: 'AD1',
    }

    expect(resolveManufacturerName(
      { ...identity, canonicalBrand: 'Analog Devices' },
      result,
    )).toBe('Analog Devices')
  })

  it('rejects persistence when no source resolved the manufacturer', () => {
    expect(() => resolveManufacturerName(identity, null)).toThrow(
      'manufacturer was not resolved',
    )
    expect(hasResolvedManufacturer(identity, null)).toBe(false)
  })
})
