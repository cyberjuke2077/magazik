import { describe, expect, it } from 'vitest'

import { extractPackageFamily } from './package-extractor'

describe('extractPackageFamily', () => {
  describe('explicit package string (source)', () => {
    it('maps LCSC-style package strings', () => {
      expect(extractPackageFamily('SOIC-8', 'X', '')).toBe('soic')
      expect(extractPackageFamily('MSOP-8', 'X', '')).toBe('msop')
      expect(extractPackageFamily('TSSOP-14', 'X', '')).toBe('tssop')
      expect(extractPackageFamily('LFCSP-8(3x3)', 'X', '')).toBe('qfn')
      expect(extractPackageFamily('WDFN-8(2x2)', 'X', '')).toBe('qfn')
      expect(extractPackageFamily('SOT-23-5', 'X', '')).toBe('sot23')
      expect(extractPackageFamily('SC-70-5', 'X', '')).toBe('sc70')
      expect(extractPackageFamily('DIP-8', 'X', '')).toBe('dip')
    })
  })

  describe('explicit mention in partNumber/name', () => {
    it('detects family from text', () => {
      expect(extractPackageFamily(null, 'SOMECHIP-SOIC8', '')).toBe('soic')
      expect(extractPackageFamily(null, 'X', 'Stabilizer TO-220')).toBe('to220')
      expect(extractPackageFamily(null, 'RES-0805-10K', '')).toBe('chip')
    })
  })

  describe('MPN package-designator (TI/ADI/Linear)', () => {
    it('decodes trailing designators', () => {
      expect(extractPackageFamily(null, 'TPS2069CDBVR', '')).toBe('sot23') // DBV
      expect(extractPackageFamily(null, 'TLV70033DCKR', '')).toBe('sc70') // DCK
      expect(extractPackageFamily(null, 'DAC8554IPWR', '')).toBe('tssop') // PW
      expect(extractPackageFamily(null, 'SN65HVD82DR', '')).toBe('soic') // D
      expect(extractPackageFamily(null, 'ADXL337BCPZ', '')).toBe('qfn') // CP (LFCSP)
      expect(extractPackageFamily(null, 'TPS54331DDAR', '')).toBe('soic') // DDA (HSOIC)
      expect(extractPackageFamily(null, 'ADUC814ARUZ-REEL7', '')).toBe('tssop') // RU
      expect(extractPackageFamily(null, 'ADM1184ARMZ-REEL7', '')).toBe('msop') // RM
      expect(extractPackageFamily(null, 'LTC1763CS8-3.3', '')).toBe('soic') // S (Linear SO-8)
    })

    it('strips reel/tape/grade noise before matching', () => {
      expect(extractPackageFamily(null, 'TLV70018DCKR', '')).toBe('sc70')
      expect(extractPackageFamily(null, 'ADP7104ACPZ-R7', '')).toBe('qfn')
      expect(extractPackageFamily(null, 'LT4356CMS-1#TRPBF', '')).toBe('msop') // MS
    })

    it('requires a digit before short designators to avoid false positives', () => {
      // "D" не должно матчиться, если перед ним буква (часть имени)
      expect(extractPackageFamily(null, 'ABCD', '')).toBeNull()
    })
  })

  describe('unresolvable', () => {
    it('returns null for unrecognized parts', () => {
      expect(extractPackageFamily(null, 'СП3-19А', 'резистор')).toBeNull()
      expect(extractPackageFamily(null, 'HMC908LC5', '')).toBeNull()
    })
  })

  describe('priority: source package beats MPN designator', () => {
    it('prefers explicit package over designator', () => {
      // partNumber designator сказал бы soic (D), но package явно SOT-23
      expect(extractPackageFamily('SOT-23-5', 'LM358DR', '')).toBe('sot23')
    })
  })
})
