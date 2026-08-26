import { describe, expect, it } from 'vitest'

import {
  canReplacePendingDatasheetSource,
  normalizeDatasheetCandidates,
} from './datasheet-candidates'

describe('normalizeDatasheetCandidates', () => {
  it('keeps unique HTTPS URLs and assigns source metadata', () => {
    expect(normalizeDatasheetCandidates([
      ' https://static.chipdip.ru/docs/a.pdf#page=2 ',
      'https://static.chipdip.ru/docs/a.pdf',
      'http://example.com/a.pdf',
      'https://user:pass@example.com/private.pdf',
    ], 'chipdip', 'ADAU1701JSTZ')).toEqual([{
      url: 'https://static.chipdip.ru/docs/a.pdf',
      source: 'chipdip',
      title: 'ADAU1701JSTZ Datasheet',
      language: 'ru',
    }])
  })

  it('caps the queue at five candidates', () => {
    const urls = Array.from({ length: 7 }, (_, index) => `https://example.com/${index}.pdf`)
    expect(normalizeDatasheetCandidates(urls, 'mouser', 'TEST')).toHaveLength(5)
  })
})

describe('canReplacePendingDatasheetSource', () => {
  it('keeps a stronger pending source', () => {
    expect(canReplacePendingDatasheetSource('chipdip', 'lcsc')).toBe(false)
    expect(canReplacePendingDatasheetSource('lcsc', 'chipdip')).toBe(true)
    expect(canReplacePendingDatasheetSource('lcsc', 'lcsc')).toBe(true)
  })
})
