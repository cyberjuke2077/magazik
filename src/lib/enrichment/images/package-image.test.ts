import { describe, expect, it } from 'vitest'

import {
  fallbackImageForProduct,
  packageFamilyImageUrl,
  packageSvgForProduct,
  GENERIC_PLACEHOLDER,
} from './package-image'

describe('packageFamilyImageUrl', () => {
  it('maps known family to its SVG', () => {
    expect(packageFamilyImageUrl('soic')).toBe('/packages/soic.svg')
    expect(packageFamilyImageUrl('qfn')).toBe('/packages/qfn.svg')
  })
  it('falls back to generic placeholder for null', () => {
    expect(packageFamilyImageUrl(null)).toBe(GENERIC_PLACEHOLDER)
  })
})

describe('fallbackImageForProduct', () => {
  it('uses source package when present', () => {
    expect(fallbackImageForProduct({ package: 'SOIC-8', partNumber: 'X' })).toBe('/packages/soic.svg')
  })
  it('derives from MPN designator', () => {
    expect(fallbackImageForProduct({ partNumber: 'TPS2069CDBVR' })).toBe('/packages/sot23.svg')
  })
  it('returns generic placeholder for unknown', () => {
    expect(fallbackImageForProduct({ partNumber: 'СП3-19А', name: 'резистор' })).toBe(GENERIC_PLACEHOLDER)
  })
})

describe('packageSvgForProduct', () => {
  it('returns SVG path for recognized package', () => {
    expect(packageSvgForProduct({ partNumber: 'LM358DR' })).toBe('/packages/soic.svg')
    expect(packageSvgForProduct({ package: 'QFN-20', partNumber: 'X' })).toBe('/packages/qfn.svg')
  })
  it('returns null (not placeholder) for unknown package', () => {
    expect(packageSvgForProduct({ partNumber: 'СП3-19А', name: 'резистор' })).toBeNull()
  })
})
