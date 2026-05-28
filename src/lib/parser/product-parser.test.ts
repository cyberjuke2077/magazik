/**
 * Product Parser Unit Tests
 * 
 * Tests all extraction functions with AAA pattern (Arrange-Act-Assert).
 * Covers happy path, edge cases, and error handling.
 */

import { describe, test, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as cheerio from 'cheerio'
import fc from 'fast-check'
import {
  parseProductPage,
  extractProductName,
  extractPartNumber,
  extractSku,
  extractManufacturer,
  extractCategory,
  extractDescription,
  extractSpecifications,
  extractImages,
  extractDatasheets,
  extractAnalogs,
} from './product-parser'

// Load HTML fixture
const fixtureHtml = readFileSync(
  join(__dirname, '__fixtures__', 'product-page.html'),
  'utf-8'
)

describe('parseProductPage', () => {
  test('successfully parses valid HTML with all fields', () => {
    // Arrange
    const html = fixtureHtml

    // Act
    const result = parseProductPage(html)

    // Assert
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data?.name).toBe('STM32F103C8T6 Микроконтроллер ARM Cortex-M3')
    expect(result.data?.partNumber).toBe('STM32F103C8T6')
    expect(result.data?.sku).toBe('CH-12345')
    expect(result.data?.manufacturer).toBe('STMicroelectronics')
    expect(result.data?.category).toBe('ARM Cortex-M')
  })

  test('returns error for empty HTML string', () => {
    // Arrange
    const html = ''

    // Act
    const result = parseProductPage(html)

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe('HTML cannot be empty')
  })

  test('returns error for whitespace-only HTML', () => {
    // Arrange
    const html = '   \n\t  '

    // Act
    const result = parseProductPage(html)

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe('HTML cannot be empty')
  })

  test('returns error for non-string input', () => {
    // Arrange
    const html = null as unknown as string

    // Act
    const result = parseProductPage(html)

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe('HTML must be a string')
  })

  test('returns error when product name cannot be extracted', () => {
    // Arrange
    const html = '<html><body><div>No product info</div></body></html>'

    // Act
    const result = parseProductPage(html)

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to extract product name')
  })

  test('handles malformed HTML gracefully', () => {
    // Arrange: malformed HTML with name AND required fields (mpn + manufacturer)
    const html = `
      <html><body>
        <h1>Product Name</h1>
        <span itemprop="mpn">ABC123</span>
        <span itemprop="brand">TestCorp</span>
        <div unclosed
      `

    // Act
    const result = parseProductPage(html)

    // Assert: cheerio handles unclosed tags, parsing succeeds
    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('Product Name')
  })
})

describe('extractProductName', () => {
  test('extracts name from h1 with product-title class', () => {
    // Arrange
    const html = '<h1 class="product-title">Test Product</h1>'
    const $ = cheerio.load(html)

    // Act
    const name = extractProductName($)

    // Assert
    expect(name).toBe('Test Product')
  })

  test('extracts name from h1 with itemprop="name"', () => {
    // Arrange
    const html = '<h1 itemprop="name">Microcontroller STM32</h1>'
    const $ = cheerio.load(html)

    // Act
    const name = extractProductName($)

    // Assert
    expect(name).toBe('Microcontroller STM32')
  })

  test('falls back to page title when h1 not found', () => {
    // Arrange
    const html = '<title>Product Name - ChipDip</title>'
    const $ = cheerio.load(html)

    // Act
    const name = extractProductName($)

    // Assert
    expect(name).toBe('Product Name')
  })

  test('removes site name suffix from title', () => {
    // Arrange
    const html = '<title>STM32F103 - ChipDip - Electronics</title>'
    const $ = cheerio.load(html)

    // Act
    const name = extractProductName($)

    // Assert
    expect(name).toBe('STM32F103')
  })

  test('returns null when no name found', () => {
    // Arrange
    const html = '<div>No title or h1</div>'
    const $ = cheerio.load(html)

    // Act
    const name = extractProductName($)

    // Assert
    expect(name).toBeNull()
  })

  test('trims whitespace from extracted name', () => {
    // Arrange
    const html = '<h1>  Product Name  </h1>'
    const $ = cheerio.load(html)

    // Act
    const name = extractProductName($)

    // Assert
    expect(name).toBe('Product Name')
  })
})

describe('extractPartNumber', () => {
  test('extracts part number from itemprop="mpn"', () => {
    // Arrange
    const html = '<span itemprop="mpn">STM32F103C8T6</span>'
    const $ = cheerio.load(html)

    // Act
    const partNumber = extractPartNumber($)

    // Assert
    expect(partNumber).toBe('STM32F103C8T6')
  })

  test('extracts part number from label "Артикул"', () => {
    // Arrange
    const html = '<dt>Артикул</dt><dd>LM358N</dd>'
    const $ = cheerio.load(html)

    // Act
    const partNumber = extractPartNumber($)

    // Assert
    expect(partNumber).toBe('LM358N')
  })

  test('extracts part number from label "Part Number"', () => {
    // Arrange
    const html = '<div class="label">Part Number:</div><div class="value">ATmega328P</div>'
    const $ = cheerio.load(html)

    // Act
    const partNumber = extractPartNumber($)

    // Assert
    expect(partNumber).toBe('ATmega328P')
  })

  test('returns null when part number not found', () => {
    // Arrange
    const html = '<div>No part number</div>'
    const $ = cheerio.load(html)

    // Act
    const partNumber = extractPartNumber($)

    // Assert
    expect(partNumber).toBeNull()
  })

  test('handles case-insensitive label matching', () => {
    // Arrange
    const html = '<dt>АРТИКУЛ</dt><dd>TEST123</dd>'
    const $ = cheerio.load(html)

    // Act
    const partNumber = extractPartNumber($)

    // Assert
    expect(partNumber).toBe('TEST123')
  })
})

describe('extractSku', () => {
  test('extracts SKU from itemprop="sku"', () => {
    // Arrange
    const html = '<span itemprop="sku">CH-12345</span>'
    const $ = cheerio.load(html)

    // Act
    const sku = extractSku($)

    // Assert
    expect(sku).toBe('CH-12345')
  })

  test('extracts SKU from label "SKU"', () => {
    // Arrange
    const html = '<dt>SKU</dt><dd>PROD-9876</dd>'
    const $ = cheerio.load(html)

    // Act
    const sku = extractSku($)

    // Assert
    expect(sku).toBe('PROD-9876')
  })

  test('extracts SKU from label "Код товара"', () => {
    // Arrange
    const html = '<span class="label">Код товара:</span><span class="value">12345</span>'
    const $ = cheerio.load(html)

    // Act
    const sku = extractSku($)

    // Assert
    expect(sku).toBe('12345')
  })

  test('returns null when SKU not found', () => {
    // Arrange
    const html = '<div>No SKU</div>'
    const $ = cheerio.load(html)

    // Act
    const sku = extractSku($)

    // Assert
    expect(sku).toBeNull()
  })
})

describe('extractManufacturer', () => {
  test('extracts manufacturer from itemprop="manufacturer"', () => {
    // Arrange
    const html = '<span itemprop="manufacturer">STMicroelectronics</span>'
    const $ = cheerio.load(html)

    // Act
    const manufacturer = extractManufacturer($)

    // Assert
    expect(manufacturer).toBe('STMicroelectronics')
  })

  test('extracts manufacturer from itemprop="brand"', () => {
    // Arrange
    const html = '<span itemprop="brand">Texas Instruments</span>'
    const $ = cheerio.load(html)

    // Act
    const manufacturer = extractManufacturer($)

    // Assert
    expect(manufacturer).toBe('Texas Instruments')
  })

  test('extracts manufacturer from label "Производитель"', () => {
    // Arrange
    const html = '<dt>Производитель</dt><dd>Microchip</dd>'
    const $ = cheerio.load(html)

    // Act
    const manufacturer = extractManufacturer($)

    // Assert
    expect(manufacturer).toBe('Microchip')
  })

  test('returns null when manufacturer not found', () => {
    // Arrange
    const html = '<div>No manufacturer</div>'
    const $ = cheerio.load(html)

    // Act
    const manufacturer = extractManufacturer($)

    // Assert
    expect(manufacturer).toBeNull()
  })
})

describe('extractCategory', () => {
  test('extracts category from breadcrumb list', () => {
    // Arrange
    const html = `
      <nav itemtype="https://schema.org/BreadcrumbList">
        <a itemprop="name">Главная</a>
        <a itemprop="name">Микроконтроллеры</a>
        <a itemprop="name">ARM Cortex-M</a>
      </nav>
    `
    const $ = cheerio.load(html)

    // Act
    const category = extractCategory($)

    // Assert
    expect(category).toBe('ARM Cortex-M')
  })

  test('extracts category from breadcrumb class', () => {
    // Arrange
    const html = `
      <div class="breadcrumb">
        <a>Home</a>
        <a>Electronics</a>
        <a>Resistors</a>
      </div>
    `
    const $ = cheerio.load(html)

    // Act
    const category = extractCategory($)

    // Assert
    expect(category).toBe('Resistors')
  })

  test('filters out "Главная" and "Home" from breadcrumbs', () => {
    // Arrange
    const html = `
      <div class="breadcrumbs">
        <a>Home</a>
        <a>Capacitors</a>
      </div>
    `
    const $ = cheerio.load(html)

    // Act
    const category = extractCategory($)

    // Assert
    expect(category).toBe('Capacitors')
  })

  test('returns null when no breadcrumbs found', () => {
    // Arrange
    const html = '<div>No breadcrumbs</div>'
    const $ = cheerio.load(html)

    // Act
    const category = extractCategory($)

    // Assert
    expect(category).toBeNull()
  })

  test('returns null when only home breadcrumb exists', () => {
    // Arrange
    const html = '<div class="breadcrumb"><a>Главная</a></div>'
    const $ = cheerio.load(html)

    // Act
    const category = extractCategory($)

    // Assert
    expect(category).toBeNull()
  })
})

describe('extractDescription', () => {
  test('extracts description from itemprop="description"', () => {
    // Arrange
    const html = '<div itemprop="description"><p>Product description</p></div>'
    const $ = cheerio.load(html)

    // Act
    const description = extractDescription($)

    // Assert
    expect(description).toBe('<p>Product description</p>')
  })

  test('extracts description from product-description class', () => {
    // Arrange
    const html = '<div class="product-description"><strong>Details</strong></div>'
    const $ = cheerio.load(html)

    // Act
    const description = extractDescription($)

    // Assert
    expect(description).toBe('<strong>Details</strong>')
  })

  test('returns null when description not found', () => {
    // Arrange
    const html = '<div>No description</div>'
    const $ = cheerio.load(html)

    // Act
    const description = extractDescription($)

    // Assert
    expect(description).toBeNull()
  })

  test('preserves HTML formatting in description', () => {
    // Arrange
    const html = '<div itemprop="description"><p>Line 1</p><ul><li>Item</li></ul></div>'
    const $ = cheerio.load(html)

    // Act
    const description = extractDescription($)

    // Assert
    expect(description).toContain('<p>Line 1</p>')
    expect(description).toContain('<ul><li>Item</li></ul>')
  })
})

describe('extractSpecifications', () => {
  test('extracts specifications from definition list (dt/dd)', () => {
    // Arrange
    const html = `
      <dl class="specifications">
        <dt>Частота</dt><dd>72 МГц</dd>
        <dt>Память</dt><dd>64 КБ</dd>
      </dl>
    `
    const $ = cheerio.load(html)

    // Act
    const specs = extractSpecifications($)

    // Assert
    expect(specs).toEqual({
      'Частота': '72 МГц',
      'Память': '64 КБ',
    })
  })

  test('extracts specifications from table (tr/th/td)', () => {
    // Arrange
    const html = `
      <table class="specifications">
        <tr><th>Voltage</th><td>5V</td></tr>
        <tr><th>Current</th><td>100mA</td></tr>
      </table>
    `
    const $ = cheerio.load(html)

    // Act
    const specs = extractSpecifications($)

    // Assert
    expect(specs).toEqual({
      'Voltage': '5V',
      'Current': '100mA',
    })
  })

  test('extracts specifications from property divs', () => {
    // Arrange
    const html = `
      <div class="property">
        <span class="property-name">Weight</span>
        <span class="property-value">10g</span>
      </div>
    `
    const $ = cheerio.load(html)

    // Act
    const specs = extractSpecifications($)

    // Assert
    expect(specs).toEqual({ 'Weight': '10g' })
  })

  test('returns empty object when no specifications found', () => {
    // Arrange
    const html = '<div>No specs</div>'
    const $ = cheerio.load(html)

    // Act
    const specs = extractSpecifications($)

    // Assert
    expect(specs).toEqual({})
  })

  test('ignores empty keys or values', () => {
    // Arrange
    const html = `
      <dl class="specifications">
        <dt></dt><dd>Value</dd>
        <dt>Key</dt><dd></dd>
        <dt>Valid</dt><dd>Data</dd>
      </dl>
    `
    const $ = cheerio.load(html)

    // Act
    const specs = extractSpecifications($)

    // Assert
    expect(specs).toEqual({ 'Valid': 'Data' })
  })
})

describe('extractImages', () => {
  test('extracts images from itemprop="image"', () => {
    // Arrange
    const html = '<img itemprop="image" src="https://example.com/image.jpg">'
    const $ = cheerio.load(html)

    // Act
    const images = extractImages($)

    // Assert
    expect(images).toEqual(['https://example.com/image.jpg'])
  })

  test('extracts images from product-images class', () => {
    // Arrange
    const html = `
      <div class="product-images">
        <img src="https://example.com/img1.jpg">
        <img src="https://example.com/img2.jpg">
      </div>
    `
    const $ = cheerio.load(html)

    // Act
    const images = extractImages($)

    // Assert
    expect(images).toEqual([
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
    ])
  })

  test('extracts images from data-src attribute', () => {
    // Arrange
    const html = '<div class="gallery"><img data-src="https://example.com/lazy.jpg"></div>'
    const $ = cheerio.load(html)

    // Act
    const images = extractImages($)

    // Assert
    expect(images).toEqual(['https://example.com/lazy.jpg'])
  })

  test('converts protocol-relative URLs to HTTPS', () => {
    // Arrange
    const html = '<img itemprop="image" src="//cdn.example.com/image.jpg">'
    const $ = cheerio.load(html)

    // Act
    const images = extractImages($)

    // Assert
    expect(images).toEqual(['https://cdn.example.com/image.jpg'])
  })

  test('filters out relative URLs', () => {
    // Arrange
    const html = `
      <div class="product-images">
        <img src="https://example.com/valid.jpg">
        <img src="/relative/path.jpg">
        <img src="relative.jpg">
      </div>
    `
    const $ = cheerio.load(html)

    // Act
    const images = extractImages($)

    // Assert
    expect(images).toEqual(['https://example.com/valid.jpg'])
  })

  test('removes duplicate images', () => {
    // Arrange
    const html = `
      <img itemprop="image" src="https://example.com/image.jpg">
      <img src="https://example.com/image.jpg">
    `
    const $ = cheerio.load(html)

    // Act
    const images = extractImages($)

    // Assert
    expect(images).toEqual(['https://example.com/image.jpg'])
  })

  test('returns empty array when no images found', () => {
    // Arrange
    const html = '<div>No images</div>'
    const $ = cheerio.load(html)

    // Act
    const images = extractImages($)

    // Assert
    expect(images).toEqual([])
  })
})

describe('extractDatasheets', () => {
  test('extracts PDF links ending with .pdf', () => {
    // Arrange
    const html = '<a href="https://example.com/datasheet.pdf">Download</a>'
    const $ = cheerio.load(html)

    // Act
    const datasheets = extractDatasheets($)

    // Assert
    expect(datasheets).toEqual(['https://example.com/datasheet.pdf'])
  })

  test('extracts links with "datasheet" in text', () => {
    // Arrange
    const html = '<a href="https://example.com/doc">Datasheet</a>'
    const $ = cheerio.load(html)

    // Act
    const datasheets = extractDatasheets($)

    // Assert
    expect(datasheets).toEqual(['https://example.com/doc'])
  })

  test('extracts links with "даташит" in text', () => {
    // Arrange
    const html = '<a href="https://example.com/doc">Даташит на русском</a>'
    const $ = cheerio.load(html)

    // Act
    const datasheets = extractDatasheets($)

    // Assert
    expect(datasheets).toEqual(['https://example.com/doc'])
  })

  test('converts protocol-relative URLs to HTTPS', () => {
    // Arrange
    const html = '<a href="//cdn.example.com/datasheet.pdf">PDF</a>'
    const $ = cheerio.load(html)

    // Act
    const datasheets = extractDatasheets($)

    // Assert
    expect(datasheets).toEqual(['https://cdn.example.com/datasheet.pdf'])
  })

  test('converts relative URLs to absolute with chipdip.ru domain', () => {
    // Arrange
    const html = '<a href="/files/datasheet.pdf">Download</a>'
    const $ = cheerio.load(html)

    // Act
    const datasheets = extractDatasheets($)

    // Assert
    expect(datasheets).toEqual(['https://www.chipdip.ru/files/datasheet.pdf'])
  })

  test('removes duplicate datasheets', () => {
    // Arrange
    const html = `
      <a href="https://example.com/doc.pdf">PDF 1</a>
      <a href="https://example.com/doc.pdf">PDF 2</a>
    `
    const $ = cheerio.load(html)

    // Act
    const datasheets = extractDatasheets($)

    // Assert
    expect(datasheets).toEqual(['https://example.com/doc.pdf'])
  })

  test('returns empty array when no datasheets found', () => {
    // Arrange
    const html = '<div>No datasheets</div>'
    const $ = cheerio.load(html)

    // Act
    const datasheets = extractDatasheets($)

    // Assert
    expect(datasheets).toEqual([])
  })
})

describe('extractAnalogs', () => {
  test('extracts analog product slugs from URLs', () => {
    // Arrange
    const html = `
      <div class="analogs">
        <a href="/product/stm32f103cbt6">STM32F103CBT6</a>
        <a href="/product/gd32f103c8t6">GD32F103C8T6</a>
      </div>
    `
    const $ = cheerio.load(html)

    // Act
    const analogs = extractAnalogs($)

    // Assert
    expect(analogs).toEqual(['stm32f103cbt6', 'gd32f103c8t6'])
  })

  test('extracts analog slugs ignoring query parameters', () => {
    // Arrange
    const html = '<a class="alternatives" href="/product/apm32f103c8t6?ref=analog">APM32</a>'
    const $ = cheerio.load(html)

    // Act
    const analogs = extractAnalogs($)

    // Assert
    expect(analogs).toEqual(['apm32f103c8t6'])
  })

  test('falls back to link text when URL does not contain /product/', () => {
    // Arrange
    const html = '<div class="similar-products"><a href="/other/link">LM358N</a></div>'
    const $ = cheerio.load(html)

    // Act
    const analogs = extractAnalogs($)

    // Assert
    expect(analogs).toEqual(['LM358N'])
  })

  test('removes duplicate analogs', () => {
    // Arrange
    const html = `
      <div class="analogs">
        <a href="/product/test123">Test</a>
        <a href="/product/test123">Test Duplicate</a>
      </div>
    `
    const $ = cheerio.load(html)

    // Act
    const analogs = extractAnalogs($)

    // Assert
    expect(analogs).toEqual(['test123'])
  })

  test('returns empty array when no analogs found', () => {
    // Arrange
    const html = '<div>No analogs</div>'
    const $ = cheerio.load(html)

    // Act
    const analogs = extractAnalogs($)

    // Assert
    expect(analogs).toEqual([])
  })

  test('ignores links with empty text and no product URL', () => {
    // Arrange
    const html = '<div class="analogs"><a href="/other"></a></div>'
    const $ = cheerio.load(html)

    // Act
    const analogs = extractAnalogs($)

    // Assert
    expect(analogs).toEqual([])
  })
})

/**
 * Bug Condition tests — extractSpecifications on real chipdip.ru HTML.
 *
 * EXPECTED on UNFIXED code: ALL tests in this describe block FAIL.
 * The failure proves the bug exists: extractSpecifications returns {} for
 * real chipdip product pages because the current selectors
 * (dl.specifications, table.specifications, .property, .spec-item) do not
 * match the actual chipdip markup, which uses table.product__params with
 * td.product__param-name / td.product__param-value cells under
 * h2#tech_params "Технические параметры".
 *
 * RECORDED COUNTEREXAMPLE (observed on UNFIXED code):
 *   - fc.assert: Property failed after 1 tests
 *     { seed: 948381516, path: "0", endOnFailure: true }
 *     Counterexample: ["stm32f103c8t6.html"]
 *     Caused by: AssertionError: expected 0 to be greater than 0
 *   - Expected keys for stm32f103c8t6.html: 'Серия', 'Ядро',
 *     'Тактовая частота, МГц', 'Тип памяти программ'
 *   - Expected keys for atmega328p-pu.html: 'Серия', 'Ядро',
 *     'Тактовая частота, МГц', 'Тип памяти программ'
 *   - Actual extractSpecifications($) returned: {} (empty record)
 *   - Sanity check passed: h2#tech_params with text "Технические параметры"
 *     and >0 td.product__param-name cells are present in BOTH fixtures
 *     => fixtures are intact, failure root cause is in extractSpecifications
 *     selectors not matching table.product__params markup.
 */
describe('extractSpecifications - chipdip real HTML', () => {
  const fixturesDir = join(__dirname, '__fixtures__', 'chipdip')
  const fixtures = ['stm32f103c8t6.html', 'atmega328p-pu.html'] as const
  const expectedKeys = ['Серия', 'Ядро', 'Тактовая частота, МГц', 'Тип памяти программ']

  test.each(fixtures)('sanity: %s contains "Технические параметры" with key/value pairs', (file) => {
    // Arrange
    const html = readFileSync(join(fixturesDir, file), 'utf-8')
    const $ = cheerio.load(html)

    // Act
    const headings = $('h1, h2, h3').filter((_, el) => {
      const text = $(el).text().trim()
      return text.startsWith('Технические параметры')
    })
    const paramRows = $('td.product__param-name').length

    // Assert — fixture must be intact, otherwise the failure below is meaningless
    expect(headings.length).toBeGreaterThan(0)
    expect(paramRows).toBeGreaterThan(0)
  })

  test('Property 1: Bug Condition — extractSpecifications извлекает специи из реального HTML chipdip.ru', () => {
    // Validates: Requirements 2.1, 2.4
    fc.assert(
      fc.property(fc.constantFrom(...fixtures), (file) => {
        const html = readFileSync(join(fixturesDir, file), 'utf-8')
        const $ = cheerio.load(html)
        const specs = extractSpecifications($)
        expect(Object.keys(specs).length).toBeGreaterThan(0)
      }),
      { numRuns: 10 },
    )
  })

  test('STM32F103C8T6 fixture exposes expected parameter keys', () => {
    // Arrange
    const html = readFileSync(join(fixturesDir, 'stm32f103c8t6.html'), 'utf-8')
    const $ = cheerio.load(html)

    // Act
    const specs = extractSpecifications($)

    // Assert
    for (const key of expectedKeys) {
      expect(specs).toHaveProperty(key)
    }
  })

  test('ATMEGA328P-PU fixture exposes expected parameter keys', () => {
    // Arrange
    const html = readFileSync(join(fixturesDir, 'atmega328p-pu.html'), 'utf-8')
    const $ = cheerio.load(html)

    // Act
    const specs = extractSpecifications($)

    // Assert
    for (const key of expectedKeys) {
      expect(specs).toHaveProperty(key)
    }
  })
})

/**
 * Preservation property tests — extractSpecifications on synthetic HTML.
 *
 * EXPECTED on UNFIXED code: all tests in this describe block PASS.
 * They lock in the baseline behavior of the existing selector branches
 * (`dl.specifications`, `table.specifications`, `.property`) and the empty
 * fallback for HTML without any specifications block. After the fix in
 * task 4.2 these tests must still pass — that is the preservation
 * guarantee for inputs that do NOT satisfy the chipdip Bug Condition.
 *
 * Validates: Requirements 3.1, 3.2, 3.7
 */
describe('extractSpecifications - preservation', () => {
  // Filter out reserved JS prototype names: assigning `specs['__proto__'] = v`
  // mutates the prototype chain and `specs[k]` returns the inherited member,
  // so the test invariant `specs[k] === v` cannot hold for these keys without
  // `Object.create(null)`. This is an artifact of the test setup, not a parser
  // regression — strip them from the property domain.
  const RESERVED_KEYS = /^(__proto__|constructor|prototype)$/
  const safeKey = (k: string): string => k.replace(/[<>&]/g, '')
  const safeValue = (v: string): string => v.replace(/[<>&]/g, '')
  const isUsablePair = ([k, v]: readonly [string, string]): boolean =>
    k.trim().length > 0 && v.trim().length > 0 && !RESERVED_KEYS.test(k.trim())
  it('Property 2: Preservation — synthetic dl returns expected key/value pairs', () => {
    // Validates: Requirements 3.1, 3.2
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 30 }),
            fc.string({ minLength: 1, maxLength: 50 }),
          ),
          { minLength: 1, maxLength: 5 },
        ),
        (pairs) => {
          // Strip HTML special chars to avoid spurious tags / entity confusion
          const safe = pairs.map(
            ([k, v]) => [safeKey(k), safeValue(v)] as const,
          )
          const html =
            `<dl class="specifications">` +
            safe.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') +
            `</dl>`
          const $ = cheerio.load(html)
          const specs = extractSpecifications($)
          for (const pair of safe) {
            if (isUsablePair(pair)) {
              expect(specs[pair[0].trim()]).toBe(pair[1].trim())
            }
          }
        },
      ),
      { numRuns: 50 },
    )
  })

  it('Property 2: Preservation — synthetic table returns expected key/value pairs', () => {
    // Validates: Requirements 3.1, 3.2
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 30 }),
            fc.string({ minLength: 1, maxLength: 50 }),
          ),
          { minLength: 1, maxLength: 5 },
        ),
        (pairs) => {
          const safe = pairs.map(
            ([k, v]) => [safeKey(k), safeValue(v)] as const,
          )
          const html =
            `<table class="specifications">` +
            safe.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('') +
            `</table>`
          const $ = cheerio.load(html)
          const specs = extractSpecifications($)
          for (const pair of safe) {
            if (isUsablePair(pair)) {
              expect(specs[pair[0].trim()]).toBe(pair[1].trim())
            }
          }
        },
      ),
      { numRuns: 50 },
    )
  })

  it('Property 2: Preservation — synthetic .property divs return expected key/value pairs', () => {
    // Validates: Requirements 3.1, 3.2
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 30 }),
            fc.string({ minLength: 1, maxLength: 50 }),
          ),
          { minLength: 1, maxLength: 5 },
        ),
        (pairs) => {
          const safe = pairs.map(
            ([k, v]) => [safeKey(k), safeValue(v)] as const,
          )
          const html = safe
            .map(
              ([k, v]) =>
                `<div class="property">` +
                `<span class="property-name">${k}</span>` +
                `<span class="property-value">${v}</span>` +
                `</div>`,
            )
            .join('')
          const $ = cheerio.load(html)
          const specs = extractSpecifications($)
          for (const pair of safe) {
            if (isUsablePair(pair)) {
              expect(specs[pair[0].trim()]).toBe(pair[1].trim())
            }
          }
        },
      ),
      { numRuns: 50 },
    )
  })

  it('Property 2: Preservation — HTML без блока характеристик возвращает {}', () => {
    // Validates: Requirements 3.7
    fc.assert(
      fc.property(
        // Filter out any string that could accidentally re-introduce supported
        // selectors (specs covers specifications/specs, property covers
        // property/properties/additionalProperty, spec-item covers itself).
        fc.string().filter((s) => !/specs|property|spec-item/i.test(s)),
        (junk) => {
          const html = `<html><body>${junk}</body></html>`
          const $ = cheerio.load(html)
          const specs = extractSpecifications($)
          expect(Object.keys(specs).length).toBe(0)
        },
      ),
      { numRuns: 100 },
    )
  })
})
