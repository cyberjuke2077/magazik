import { describe, expect, it } from 'vitest'

import { isMatchingLcscProduct } from './lcsc-client'

describe('isMatchingLcscProduct', () => {
  it('accepts the same normalized MPN', () => {
    expect(isMatchingLcscProduct('MAX232ESE+', 'max232ese')).toBe(true)
  })

  it('rejects a different part returned by broad search', () => {
    expect(isMatchingLcscProduct('STM32F469ZIT6', 'STM32F469AIH6')).toBe(false)
  })

  it('rejects a product without an explicit MPN', () => {
    expect(isMatchingLcscProduct('STM32F469ZIT6', undefined)).toBe(false)
    expect(isMatchingLcscProduct('STM32F469ZIT6', '')).toBe(false)
  })
})
