import { describe, expect, it } from 'vitest'

import {
  canReplacePendingImageSource,
  normalizeImageCandidates,
} from './image-candidates'

describe('normalizeImageCandidates', () => {
  it('keeps only unique HTTP image URLs without credentials or fragments', () => {
    const candidates = normalizeImageCandidates([
      ' https://static.chipdip.ru/image.jpg#preview ',
      'https://static.chipdip.ru/image.jpg',
      'data:image/png;base64,abc',
      'https://user:pass@example.com/private.jpg',
    ], 'chipdip')

    expect(candidates).toEqual([{
      url: 'https://static.chipdip.ru/image.jpg',
      source: 'chipdip',
    }])
  })

  it('caps the queue to ten candidates', () => {
    const urls = Array.from({ length: 12 }, (_, index) => `https://example.com/${index}.jpg`)
    expect(normalizeImageCandidates(urls, 'mouser')).toHaveLength(10)
  })
})

describe('canReplacePendingImageSource', () => {
  it('keeps a stronger pending source', () => {
    expect(canReplacePendingImageSource('chipdip', 'lcsc')).toBe(false)
    expect(canReplacePendingImageSource('lcsc', 'chipdip')).toBe(true)
    expect(canReplacePendingImageSource('lcsc', 'lcsc')).toBe(true)
  })
})
