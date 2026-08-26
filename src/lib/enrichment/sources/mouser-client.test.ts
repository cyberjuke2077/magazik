import { describe, expect, it } from 'vitest'

import { type MouserPart, selectMouserPart } from './mouser-client'

function part(manufacturer: string, manufacturerPartNumber: string): MouserPart {
  return {
    Manufacturer: manufacturer,
    ManufacturerPartNumber: manufacturerPartNumber,
    MouserPartNumber: `M-${manufacturerPartNumber}`,
    Description: 'Test part',
  }
}

describe('selectMouserPart', () => {
  it('discovers the manufacturer for one exact MPN-only result', () => {
    const result = selectMouserPart(
      [part('Analog Devices', 'ADG212AKNZ')],
      'ADG212AKNZ',
      '',
    )

    expect(result?.Manufacturer).toBe('Analog Devices')
  })

  it('rejects an ambiguous MPN-only result from different manufacturers', () => {
    const result = selectMouserPart(
      [part('Vendor A', 'LM358'), part('Vendor B', 'LM358')],
      'LM358',
      '',
    )

    expect(result).toBeNull()
  })

  it('requires both MPN and supplied manufacturer to match', () => {
    const result = selectMouserPart(
      [
        part('Analog Devices', 'OTHER-PART'),
        part('Analog Devices', 'ADG212AKNZ'),
      ],
      'ADG212AKNZ',
      'Analog Devices',
    )

    expect(result?.ManufacturerPartNumber).toBe('ADG212AKNZ')
  })
})
