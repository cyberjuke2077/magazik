/**
 * Product Parser Module
 * 
 * Extracts structured product data from ChipDip HTML pages using Cheerio.
 * Pure functions with comprehensive error handling and input validation.
 * 
 * Architecture:
 * - Pure functions for each data extraction task
 * - Immutable data structures
 * - Explicit error handling with ParseResult wrapper
 * - No side effects (no logging, no I/O)
 */

import * as cheerio from 'cheerio'
import { type ParsedProduct, type ParseResult, type SpecificationRow } from './types'

/**
 * Validates that input HTML is non-empty string
 */
function validateHtml(html: string): ParseResult<string> {
  if (typeof html !== 'string') {
    return { success: false, error: 'HTML must be a string' }
  }
  
  if (html.trim().length === 0) {
    return { success: false, error: 'HTML cannot be empty' }
  }
  
  return { success: true, data: html }
}

/**
 * Safely extracts text content from element
 * Returns null if element not found or empty
 */
function extractText($: cheerio.CheerioAPI, selector: string): string | null {
  const element = $(selector).first()
  if (element.length === 0) return null
  
  const text = element.text().trim()
  return text.length > 0 ? text : null
}

/**
 * Safely extracts HTML content from element
 * Returns null if element not found or empty
 */
function extractHtml($: cheerio.CheerioAPI, selector: string): string | null {
  const element = $(selector).first()
  if (element.length === 0) return null
  
  const html = element.html()
  return html && html.trim().length > 0 ? html.trim() : null
}

/**
 * Extracts product name from page title or h1
 * Tries multiple selectors in priority order
 */
export function extractProductName($: cheerio.CheerioAPI): string | null {
  // Try h1 first (most common)
  const h1 = extractText($, 'h1.product-title, h1[itemprop="name"], h1')
  if (h1) return h1
  
  // Fallback to page title
  const title = extractText($, 'title')
  if (title) {
    // Remove site name suffix (e.g., " - ChipDip")
    return title.split(' - ')[0]?.trim() || title
  }
  
  return null
}

/**
 * Extracts part number from product page
 * Looks for common patterns: "Артикул:", "Part Number:", title, meta keywords, gtag
 */
export function extractPartNumber($: cheerio.CheerioAPI): string | null {
  // Try gtag data first (ChipDip 2026 format)
  const scripts = $('script').toArray()
  for (const script of scripts) {
    const content = $(script).html() || ''
    if (content.includes('window.gtag') && content.includes('"name"')) {
      const match = content.match(/"name":"([^"]+)"/)
      if (match && match[1]) return match[1]
    }
  }
  
  // Try structured data
  const partNumber = extractText($, '[itemprop="mpn"], [itemprop="productID"]')
  if (partNumber) return partNumber
  
  // Try common label patterns
  const labels = $('dt, .label, .property-name')
  for (let i = 0; i < labels.length; i++) {
    const label = $(labels[i]).text().trim().toLowerCase()
    if (label.includes('артикул') || label.includes('part number') || label.includes('партномер')) {
      const value = $(labels[i]).next('dd, .value, .property-value').text().trim()
      if (value.length > 0) return value
    }
  }
  
  // Fallback: extract from title (ChipDip specific)
  // Format: "PARTNUMBER, Description [Package]"
  const title = $('title').text().trim()
  if (title) {
    const match = title.match(/^([A-Z0-9\-]+),/)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  // Fallback: extract from meta keywords (ChipDip specific)
  // Format: "PartNumber, Category, Manufacturer"
  const metaKeywords = $('meta[name="keywords"]').attr('content')
  if (metaKeywords) {
    const parts = metaKeywords.split(',').map(s => s.trim())
    // Part number is usually the first item
    if (parts.length >= 1 && parts[0].length > 0) {
      return parts[0]
    }
  }
  
  return null
}

/**
 * Extracts SKU (ChipDip internal ID) from product page
 */
export function extractSku($: cheerio.CheerioAPI): string | null {
  // Try structured data
  const sku = extractText($, '[itemprop="sku"]')
  if (sku) return sku
  
  // Try common label patterns
  const labels = $('dt, .label, .property-name')
  for (let i = 0; i < labels.length; i++) {
    const label = $(labels[i]).text().trim().toLowerCase()
    if (label.includes('sku') || label.includes('код товара')) {
      const value = $(labels[i]).next('dd, .value, .property-value').text().trim()
      if (value.length > 0) return value
    }
  }
  
  return null
}

/**
 * Extracts manufacturer name from product page
 */
export function extractManufacturer($: cheerio.CheerioAPI): string | null {
  // Try gtag data first (ChipDip 2026 format - short brand name)
  const scripts = $('script').toArray()
  for (const script of scripts) {
    const content = $(script).html() || ''
    if (content.includes('window.gtag') && content.includes('"brand"')) {
      const match = content.match(/"brand":"([^"]+)"/)
      if (match && match[1]) return match[1]
    }
  }
  
  // Try structured data (returns full name like "Guangdong Huaguan...")
  const manufacturer = extractText($, '[itemprop="manufacturer"], [itemprop="brand"]')
  if (manufacturer) return manufacturer
  
  // Try common label patterns
  const labels = $('dt, .label, .property-name')
  for (let i = 0; i < labels.length; i++) {
    const label = $(labels[i]).text().trim().toLowerCase()
    if (label.includes('производитель') || label.includes('manufacturer') || label.includes('бренд')) {
      const value = $(labels[i]).next('dd, .value, .property-value').text().trim()
      if (value.length > 0) return value
    }
  }
  
  return null
}

/**
 * Extracts category from breadcrumbs or meta keywords
 * Returns the last breadcrumb item (most specific category)
 */
export function extractCategory($: cheerio.CheerioAPI): string | null {
  // Try breadcrumbs first
  const breadcrumbs = $('[itemtype*="BreadcrumbList"] [itemprop="name"], .breadcrumb a, .breadcrumbs a')
  
  if (breadcrumbs.length > 0) {
    // Get last breadcrumb (most specific category), skip "Home" if present
    const items = breadcrumbs
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 0 && !text.toLowerCase().includes('главная') && !text.toLowerCase().includes('home'))
    
    if (items.length > 0) {
      return items[items.length - 1] || null
    }
  }
  
  // Fallback: try meta keywords (ChipDip specific)
  // Format: "PartNumber, Category, Manufacturer"
  const metaKeywords = $('meta[name="keywords"]').attr('content')
  if (metaKeywords) {
    const parts = metaKeywords.split(',').map(s => s.trim())
    // Category is usually the second item
    if (parts.length >= 2 && parts[1].length > 0) {
      return parts[1]
    }
  }
  
  return null
}

/**
 * Extracts product description (HTML content)
 */
export function extractDescription($: cheerio.CheerioAPI): string | null {
  // Try common description selectors
  const selectors = [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#description',
    '.product-details',
  ]
  
  for (const selector of selectors) {
    const html = extractHtml($, selector)
    if (html) return html
  }
  
  return null
}

/**
 * Parses specifications table into key-value pairs
 * Handles various table structures (dt/dd, tr/td, etc.)
 */
export function extractSpecifications($: cheerio.CheerioAPI): Record<string, string> {
  const specs: Record<string, string> = {}
  
  // Try definition list (dt/dd)
  // Match both <dl class="specifications"> and <div class="specifications"><dl>
  $('dl.specifications, dl.specs, .specifications dl, .specs dl, [itemprop="additionalProperty"]').each((_, dl) => {
    $(dl).find('dt').each((_, dt) => {
      const key = $(dt).text().trim()
      const value = $(dt).next('dd').text().trim()
      if (key && value) {
        specs[key] = value
      }
    })
  })
  
  // Try table rows (tr with th/td)
  // Match both <table class="specifications"> and <div class="specifications"><table>
  $('table.specifications tr, table.specs tr, .specifications table tr, .specs table tr, .properties table tr').each((_, tr) => {
    const cells = $(tr).find('th, td')
    if (cells.length >= 2) {
      const key = $(cells[0]).text().trim()
      const value = $(cells[1]).text().trim()
      if (key && value) {
        specs[key] = value
      }
    }
  })
  
  // Try generic property lists
  $('.property, .spec-item').each((_, item) => {
    const key = $(item).find('.property-name, .spec-name, .label').text().trim()
    const value = $(item).find('.property-value, .spec-value, .value').text().trim()
    if (key && value) {
      specs[key] = value
    }
  })
  
  return specs
}

/**
 * Extracts all product image URLs
 * Returns array of absolute URLs
 */
export function extractImages($: cheerio.CheerioAPI): string[] {
  // DISABLED: Images from ChipDip have watermarks and low quality
  // Will be added manually via admin panel
  return []
  
  /* Original implementation (disabled):
  const images = new Set<string>()
  
  // ChipDip specific: product__image-preview class
  $('img.product__image-preview').each((_, img) => {
    const src = $(img).attr('src')
    if (src && src.includes('static.chipdip.ru')) {
      images.add(src)
    }
  })
  
  // Fallback: data-image attribute
  $('[data-image]').each((_, el) => {
    const src = $(el).attr('data-image')
    if (src && src.includes('static.chipdip.ru')) {
      images.add(src)
    }
  })
  
  // Fallback: structured data
  $('[itemprop="image"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('content')
    if (src) images.add(src)
  })
  
  // Filter out invalid URLs and make absolute
  return Array.from(images)
    .filter(url => url.startsWith('http') || url.startsWith('//'))
    .map(url => url.startsWith('//') ? `https:${url}` : url)
  */
}

/**
 * Extracts datasheet PDF links
 * Returns array of absolute URLs
 */
export function extractDatasheets($: cheerio.CheerioAPI): string[] {
  const datasheets = new Set<string>()
  
  // Find links containing "datasheet" or ending with .pdf
  $('a').each((_, link) => {
    const href = $(link).attr('href')
    const text = $(link).text().toLowerCase()
    
    if (href && (href.endsWith('.pdf') || text.includes('datasheet') || text.includes('даташит'))) {
      datasheets.add(href)
    }
  })
  
  // Make URLs absolute
  return Array.from(datasheets)
    .filter(url => url.startsWith('http') || url.startsWith('//') || url.startsWith('/'))
    .map(url => {
      if (url.startsWith('//')) return `https:${url}`
      if (url.startsWith('/')) return `https://www.chipdip.ru${url}`
      return url
    })
}

/**
 * Extracts analog/alternative product URLs or part numbers
 * Returns array of product identifiers
 */
export function extractAnalogs($: cheerio.CheerioAPI): string[] {
  const analogs = new Set<string>()
  
  // Try common analog sections
  // Match both <a class="alternatives"> and <div class="alternatives"><a>
  $('a.analogs, a.alternatives, a.similar-products, .analogs a, .alternatives a, .similar-products a').each((_, link) => {
    const href = $(link).attr('href')
    const text = $(link).text().trim()
    
    // Extract product slug from URL (e.g., /product/stm32f103c8t6 -> stm32f103c8t6)
    if (href && href.includes('/product/')) {
      const slug = href.split('/product/')[1]?.split('/')[0]?.split('?')[0]
      if (slug) analogs.add(slug)
    } else if (text.length > 0) {
      // Use link text as part number
      analogs.add(text)
    }
  })
  
  return Array.from(analogs)
}

/**
 * Extracts product weight in grams
 * Looks for "Вес, г" or "Вес" in specifications table
 * Returns null if not found or invalid
 */
export function extractWeight($: cheerio.CheerioAPI): number | null {
  // Try to find weight in specifications table
  let weightText: string | null = null
  
  // Look for "Вес, г" or "Вес" in ChipDip's product__params table
  $('table.product__params tr').each((_, tr) => {
    const nameCell = $(tr).find('td.product__param-name')
    const valueCell = $(tr).find('td.product__param-value')
    
    if (nameCell.length > 0 && valueCell.length > 0) {
      const key = nameCell.text().trim()
      // Match "Вес, г" or "Вес"
      if (key.match(/^Вес/i)) {
        weightText = valueCell.text().trim()
        return false // Break loop
      }
    }
  })
  
  if (!weightText) return null
  
  // Parse weight value - extract first number
  // Examples: "0.5", "1.2 г", "10", "0,5" (comma as decimal separator)
  const match = weightText.replace(',', '.').match(/[\d.]+/)
  if (!match) return null
  
  const weight = parseFloat(match[0])
  return isNaN(weight) ? null : weight
}

/**
 * Main parser function - orchestrates all extraction functions
 * 
 * @param html - Raw HTML string from ChipDip product page
 * @returns ParseResult with ParsedProduct data or error
 */
export function parseProductPage(html: string): ParseResult<ParsedProduct> {
  // Validate input
  const validation = validateHtml(html)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }
  
  try {
    // Load HTML into Cheerio
    const $ = cheerio.load(html)
    
    // Check for 404 page
    const pageTitle = extractText($, 'title')
    if (pageTitle && pageTitle.includes('Страница не найдена')) {
      return {
        success: false,
        error: 'Product page not found (404)',
      }
    }
    
    // Extract all fields using pure functions
    const product: ParsedProduct = {
      name: extractProductName($) || '',
      partNumber: extractPartNumber($),
      sku: extractSku($),
      manufacturer: extractManufacturer($),
      category: extractCategory($),
      description: extractDescription($),
      weight: extractWeight($),
      specifications: extractSpecifications($),
      images: extractImages($),
      datasheets: extractDatasheets($),
      analogs: extractAnalogs($),
    }
    
    // Validate that at least name was extracted
    if (!product.name || product.name.length === 0) {
      return {
        success: false,
        error: 'Failed to extract product name - invalid HTML structure',
      }
    }
    
    // Validate required fields - manufacturer and partNumber are critical
    if (!product.manufacturer || !product.partNumber) {
      return {
        success: false,
        error: 'Missing required fields: manufacturer or partNumber',
      }
    }
    
    return { success: true, data: product }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
    return {
      success: false,
      error: `Failed to parse product page: ${errorMessage}`,
    }
  }
}
