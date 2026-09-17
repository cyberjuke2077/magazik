import { describe, it, expect } from 'vitest'
import { parseCatalogParams } from './catalog-utils'
import { formatPrice } from './utils'

describe('formatPrice', () => {
  it('returns "Цена по запросу" for null', () => {
    expect(formatPrice(null)).toBe('Цена по запросу')
  })

  it('returns "Цена по запросу" for undefined', () => {
    expect(formatPrice(undefined)).toBe('Цена по запросу')
  })

  it('returns "Цена по запросу" for 0', () => {
    expect(formatPrice(0)).toBe('Цена по запросу')
  })

  it.each([
    [0.01, '0,01\u00a0₽'],
    [0.24, '0,24\u00a0₽'],
    [2.4, '2,40\u00a0₽'],
    [160, '160\u00a0₽'],
  ])('keeps kopecks for %s', (price, expected) => {
    expect(formatPrice(price)).toBe(expected)
  })
})

describe('parseCatalogParams', () => {
  it('returns defaults when no params provided', () => {
    const result = parseCatalogParams({}, 100)
    expect(result).toEqual({
      page: 1,
      limit: 50,
      query: null,
      categorySlug: null,
      manufacturerSlug: null,
      sort: 'date',
      view: 'list',
    })
  })

  it('parses page and limit from searchParams', () => {
    const result = parseCatalogParams({ page: '3', limit: '25' }, 100)
    expect(result.page).toBe(3)
    expect(result.limit).toBe(25)
  })

  it('clamps page to totalPages', () => {
    const result = parseCatalogParams({ page: '999' }, 100)
    // totalPages = ceil(100/50) = 2
    expect(result.page).toBe(2)
  })

  it('clamps page to 1 when less than 1', () => {
    const result = parseCatalogParams({ page: '0' }, 100)
    expect(result.page).toBe(1)
  })

  it('clamps page to 1 for negative values', () => {
    const result = parseCatalogParams({ page: '-5' }, 100)
    expect(result.page).toBe(1)
  })

  it('clamps limit to 100 when exceeding max', () => {
    const result = parseCatalogParams({ limit: '200' }, 1000)
    expect(result.limit).toBe(100)
  })

  it('defaults limit to 50 for invalid values', () => {
    const result = parseCatalogParams({ limit: 'abc' }, 100)
    expect(result.limit).toBe(50)
  })

  it('parses query from q param', () => {
    const result = parseCatalogParams({ q: '  100k resistor  ' }, 100)
    expect(result.query).toBe('100k resistor')
  })

  it('returns null query for empty string', () => {
    const result = parseCatalogParams({ q: '   ' }, 100)
    expect(result.query).toBe(null)
  })

  it('parses category and manufacturer slugs', () => {
    const result = parseCatalogParams(
      { category: 'resistors', manufacturer: 'yageo' },
      100,
    )
    expect(result.categorySlug).toBe('resistors')
    expect(result.manufacturerSlug).toBe('yageo')
  })

  it('handles totalItems = 0 gracefully', () => {
    const result = parseCatalogParams({ page: '5' }, 0)
    expect(result.page).toBe(1)
  })

  it('handles array values in searchParams', () => {
    const result = parseCatalogParams(
      { page: ['2', '3'], q: ['hello'] },
      100,
    )
    expect(result.page).toBe(2)
    expect(result.query).toBe('hello')
  })
})
