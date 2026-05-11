/**
 * Unit tests for catalog scraper
 * Tests catalog URL extraction, pagination handling, and edge cases
 */

import { describe, test, expect } from 'vitest'
import {
  scrapeCatalogPage,
  extractSlugFromUrl,
  isValidSlug,
  extractPaginationInfo,
  scrapeCatalog,
} from './catalog-scraper'

describe('extractSlugFromUrl', () => {
  test('extracts slug from relative URL', () => {
    // Arrange
    const url = '/product/stm32f103c8t6'

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBe('stm32f103c8t6')
  })

  test('extracts slug from absolute URL', () => {
    // Arrange
    const url = 'https://www.chipdip.ru/product/atmega328p-pu/'

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBe('atmega328p-pu')
  })

  test('extracts slug with trailing slash', () => {
    // Arrange
    const url = '/product/lm358n/'

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBe('lm358n')
  })

  test('extracts slug with query parameters', () => {
    // Arrange
    const url = '/product/ne555p?view=full&ref=catalog'

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBe('ne555p')
  })

  test('returns null for invalid URL', () => {
    // Arrange
    const url = '/catalog/microcontrollers'

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBeNull()
  })

  test('returns null for empty string', () => {
    // Arrange
    const url = ''

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBeNull()
  })

  test('returns null for non-string input', () => {
    // Arrange
    const url = null as unknown as string

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBeNull()
  })

  test('normalizes slug to lowercase', () => {
    // Arrange
    const url = '/product/STM32F103C8T6'

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBe('stm32f103c8t6')
  })

  test('returns null for invalid slug characters', () => {
    // Arrange
    const url = '/product/invalid slug with spaces'

    // Act
    const result = extractSlugFromUrl(url)

    // Assert
    expect(result).toBeNull()
  })
})

describe('isValidSlug', () => {
  test('validates alphanumeric slug', () => {
    // Arrange
    const slug = 'stm32f103c8t6'

    // Act
    const result = isValidSlug(slug)

    // Assert
    expect(result).toBe(true)
  })

  test('validates slug with hyphens', () => {
    // Arrange
    const slug = 'atmega328p-pu'

    // Act
    const result = isValidSlug(slug)

    // Assert
    expect(result).toBe(true)
  })

  test('validates slug with underscores', () => {
    // Arrange
    const slug = 'lm358_dip8'

    // Act
    const result = isValidSlug(slug)

    // Assert
    expect(result).toBe(true)
  })

  test('rejects empty slug', () => {
    // Arrange
    const slug = ''

    // Act
    const result = isValidSlug(slug)

    // Assert
    expect(result).toBe(false)
  })

  test('rejects slug with spaces', () => {
    // Arrange
    const slug = 'invalid slug'

    // Act
    const result = isValidSlug(slug)

    // Assert
    expect(result).toBe(false)
  })

  test('rejects slug with special characters', () => {
    // Arrange
    const slug = 'product@123'

    // Act
    const result = isValidSlug(slug)

    // Assert
    expect(result).toBe(false)
  })

  test('rejects slug with uppercase letters', () => {
    // Arrange
    const slug = 'STM32F103'

    // Act
    const result = isValidSlug(slug)

    // Assert
    expect(result).toBe(false)
  })

  test('rejects slug longer than 200 characters', () => {
    // Arrange
    const slug = 'a'.repeat(201)

    // Act
    const result = isValidSlug(slug)

    // Assert
    expect(result).toBe(false)
  })
})

describe('scrapeCatalogPage', () => {
  test('extracts product slugs from catalog HTML', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="catalog">
            <a href="/product/stm32f103c8t6">STM32F103C8T6</a>
            <a href="/product/atmega328p-pu">ATmega328P</a>
            <a href="/product/lm358n">LM358N</a>
          </div>
        </body>
      </html>
    `

    // Act
    const result = scrapeCatalogPage(html)

    // Assert
    expect(result).toEqual(['stm32f103c8t6', 'atmega328p-pu', 'lm358n'])
  })

  test('removes duplicate slugs', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <a href="/product/stm32f103c8t6">Product 1</a>
          <a href="/product/stm32f103c8t6">Product 1 Again</a>
          <a href="/product/atmega328p">Product 2</a>
        </body>
      </html>
    `

    // Act
    const result = scrapeCatalogPage(html)

    // Assert
    expect(result).toEqual(['stm32f103c8t6', 'atmega328p'])
  })

  test('handles absolute URLs', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <a href="https://www.chipdip.ru/product/ne555p">NE555</a>
          <a href="http://chipdip.ru/product/lm358n/">LM358</a>
        </body>
      </html>
    `

    // Act
    const result = scrapeCatalogPage(html)

    // Assert
    expect(result).toEqual(['ne555p', 'lm358n'])
  })

  test('filters out invalid slugs', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <a href="/product/valid-slug">Valid</a>
          <a href="/product/INVALID SLUG">Invalid</a>
          <a href="/product/another-valid">Valid 2</a>
        </body>
      </html>
    `

    // Act
    const result = scrapeCatalogPage(html)

    // Assert
    expect(result).toEqual(['valid-slug', 'another-valid'])
  })

  test('returns empty array for empty HTML', () => {
    // Arrange
    const html = ''

    // Act
    const result = scrapeCatalogPage(html)

    // Assert
    expect(result).toEqual([])
  })

  test('returns empty array for HTML without product links', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <a href="/catalog">Catalog</a>
          <a href="/about">About</a>
        </body>
      </html>
    `

    // Act
    const result = scrapeCatalogPage(html)

    // Assert
    expect(result).toEqual([])
  })

  test('handles malformed HTML gracefully', () => {
    // Arrange
    const html = '<div><a href="/product/stm32">Product</div>'

    // Act
    const result = scrapeCatalogPage(html)

    // Assert
    expect(result).toEqual(['stm32'])
  })
})

describe('extractPaginationInfo', () => {
  test('extracts pagination info from catalog page', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="pagination">
            <a href="?page=1">1</a>
            <span class="active">2</span>
            <a href="?page=3">3</a>
            <a href="?page=4">4</a>
            <a href="?page=5">5</a>
          </div>
          <div>Найдено: 125 товаров</div>
        </body>
      </html>
    `

    // Act
    const result = extractPaginationInfo(html)

    // Assert
    expect(result).toEqual({
      currentPage: 2,
      totalPages: 5,
      totalProducts: 125,
      hasNextPage: true,
    })
  })

  test('detects last page correctly', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="pagination">
            <a href="?page=1">1</a>
            <a href="?page=2">2</a>
            <span class="current">3</span>
          </div>
        </body>
      </html>
    `

    // Act
    const result = extractPaginationInfo(html)

    // Assert
    expect(result?.hasNextPage).toBe(false)
    expect(result?.currentPage).toBe(3)
    expect(result?.totalPages).toBe(3)
  })

  test('handles pagination with pager class', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="pager">
            <span class="active">1</span>
            <a href="?page=2">2</a>
            <a href="?page=3">3</a>
          </div>
        </body>
      </html>
    `

    // Act
    const result = extractPaginationInfo(html)

    // Assert
    expect(result?.currentPage).toBe(1)
    expect(result?.totalPages).toBe(3)
  })

  test('extracts total products with comma separator', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="pagination">
            <span class="active">1</span>
            <a href="?page=2">2</a>
          </div>
          <div>395,850 товаров</div>
        </body>
      </html>
    `

    // Act
    const result = extractPaginationInfo(html)

    // Assert
    expect(result?.totalProducts).toBe(395850)
  })

  test('returns null for empty HTML', () => {
    // Arrange
    const html = ''

    // Act
    const result = extractPaginationInfo(html)

    // Assert
    expect(result).toBeNull()
  })

  test('returns null when no pagination found', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div>No pagination here</div>
        </body>
      </html>
    `

    // Act
    const result = extractPaginationInfo(html)

    // Assert
    expect(result).toBeNull()
  })

  test('defaults to page 1 when current page not found', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="pagination">
            <a href="?page=1">1</a>
            <a href="?page=2">2</a>
            <a href="?page=3">3</a>
          </div>
        </body>
      </html>
    `

    // Act
    const result = extractPaginationInfo(html)

    // Assert
    expect(result?.currentPage).toBe(1)
  })

  test('returns 0 for total products when not found', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="pagination">
            <span class="active">1</span>
            <a href="?page=2">2</a>
          </div>
        </body>
      </html>
    `

    // Act
    const result = extractPaginationInfo(html)

    // Assert
    expect(result?.totalProducts).toBe(0)
  })
})

describe('scrapeCatalog', () => {
  test('returns structured result with slugs and pagination', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="catalog">
            <a href="/product/stm32f103c8t6">STM32</a>
            <a href="/product/atmega328p">ATmega</a>
          </div>
          <div class="pagination">
            <span class="active">1</span>
            <a href="?page=2">2</a>
            <a href="?page=3">3</a>
          </div>
          <div>Найдено: 50 товаров</div>
        </body>
      </html>
    `

    // Act
    const result = scrapeCatalog(html)

    // Assert
    expect(result.productSlugs).toEqual(['stm32f103c8t6', 'atmega328p'])
    expect(result.pagination).toEqual({
      currentPage: 1,
      totalPages: 3,
      totalProducts: 50,
      hasNextPage: true,
    })
  })

  test('handles catalog without pagination', () => {
    // Arrange
    const html = `
      <html>
        <body>
          <div class="catalog">
            <a href="/product/ne555p">NE555</a>
          </div>
        </body>
      </html>
    `

    // Act
    const result = scrapeCatalog(html)

    // Assert
    expect(result.productSlugs).toEqual(['ne555p'])
    expect(result.pagination).toBeNull()
  })

  test('handles empty catalog', () => {
    // Arrange
    const html = '<html><body></body></html>'

    // Act
    const result = scrapeCatalog(html)

    // Assert
    expect(result.productSlugs).toEqual([])
    expect(result.pagination).toBeNull()
  })
})
