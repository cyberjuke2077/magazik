import { describe, expect, it } from 'vitest'

import type { EnrichmentResult } from '../types'
import { determineEnrichmentStatus } from './persistence-service'

function completeResult(descriptionLanguage: 'ru' | 'en'): EnrichmentResult {
  return {
    source: descriptionLanguage === 'ru' ? 'chipdip' : 'lcsc',
    mpn: 'STM32F469ZIT6',
    brand: 'STMicroelectronics',
    name: 'STM32F469ZIT6',
    description: 'Описание',
    descriptionLanguage,
    specs: [{ key: 'Корпус', value: 'LQFP-144' }],
  }
}

describe('determineEnrichmentStatus', () => {
  it('marks a complete Russian card as complete', () => {
    expect(determineEnrichmentStatus(completeResult('ru'))).toBe('complete')
  })

  it('keeps an English fallback card partial until localization', () => {
    expect(determineEnrichmentStatus(completeResult('en'))).toBe('partial')
  })

  it('marks a missing result as unresolved', () => {
    expect(determineEnrichmentStatus(null)).toBe('unresolved')
  })
})
