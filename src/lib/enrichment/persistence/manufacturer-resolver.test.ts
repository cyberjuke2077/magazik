import { expect, it } from 'vitest'

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

it('uses and normalizes a manufacturer discovered by an enrichment source', () => {
  const result: EnrichmentResult = {
    source: 'mouser',
    mpn: 'ADG212AKNZ',
    brand: 'ADI',
  }

  expect(resolveManufacturerName(identity, result)).toBe('Analog Devices')
})

it('rejects persistence when no source resolved the manufacturer', () => {
  expect(() => resolveManufacturerName(identity, null)).toThrow(
    'manufacturer was not resolved',
  )
})

it('reports whether a safe product stub can be persisted', () => {
  expect(hasResolvedManufacturer(identity, null)).toBe(false)
  expect(hasResolvedManufacturer(
    { ...identity, canonicalBrand: 'Analog Devices' },
    null,
  )).toBe(true)
})
