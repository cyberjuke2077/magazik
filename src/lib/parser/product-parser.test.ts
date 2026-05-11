/**
 * Product Parser Unit Tests
 * 
 * Tests all extraction functions with AAA pattern (Arrange-Act-Assert).
 * Covers happy path, edge cases, and error handling.
 */

import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as cheerio from 'cheerio'
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
    const html = null as any

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
    // Arrange
    const html = '<html><body><h1>Product Name</h1><div unclosed'

    // Act
    const result = parseProductPage(html)

    // Assert
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
