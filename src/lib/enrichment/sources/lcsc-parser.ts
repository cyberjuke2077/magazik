/**
 * LCSC Product Page HTML Parser
 *
 * Extracts structured product data from LCSC (lcsc.com) product pages
 * using Cheerio. Pure function — no side effects, no I/O.
 */

import * as cheerio from 'cheerio'

export interface LcscParsedProduct {
  name: string | null
  description: string | null
  specs: Array<{ key: string; value: string }>
  datasheetUrls: string[]
  imageUrls: string[]
  package: string | null
  lifecycle: string | null
  manufacturer: string | null
  lcscPartNumber: string | null
}

/**
 * Parses an LCSC product page HTML and extracts structured data.
 *
 * @param html - Raw HTML string from an LCSC product page
 * @returns Parsed product data or null if HTML is invalid/empty
 */
export function parseLcscProductPage(html: string): LcscParsedProduct | null {
  if (!html || html.trim().length === 0) {
    return null
  }

  const $ = cheerio.load(html)

  const name = extractName($)
  const description = extractDescription($)
  const specs = extractSpecs($)
  const datasheetUrls = extractDatasheetUrls($)
  const imageUrls = extractImageUrls($)
  const packageValue = extractFromSpecs(specs, ['package', 'корпус', 'pkg'])
  const lifecycle = extractFromSpecs(specs, ['lifecycle', 'status', 'life cycle'])
  const manufacturer = extractManufacturer($, specs)
  const lcscPartNumber = extractLcscPartNumber($)

  // If we couldn't extract anything meaningful, return null
  if (!name && !description && specs.length === 0 && datasheetUrls.length === 0) {
    return null
  }

  return {
    name,
    description,
    specs,
    datasheetUrls,
    imageUrls,
    package: packageValue,
    lifecycle,
    manufacturer,
    lcscPartNumber,
  }
}

/**
 * Extracts product name from the page.
 * Tries: h1, .product-title, [class*="product-name"], title tag
 */
function extractName($: cheerio.CheerioAPI): string | null {
  const selectors = [
    'h1',
    '.product-title',
    '[class*="product-name"]',
    '[class*="productName"]',
  ]

  for (const selector of selectors) {
    const el = $(selector).first()
    if (el.length > 0) {
      const text = el.text().trim()
      if (text.length > 0) return text
    }
  }

  // Fallback: page title
  const title = $('title').text().trim()
  if (title.length > 0) {
    // Remove " - LCSC" or similar suffix
    const cleaned = title.replace(/\s*[-|]\s*LCSC.*$/i, '').trim()
    return cleaned.length > 0 ? cleaned : null
  }

  return null
}

/**
 * Extracts product description.
 * Tries: .product-description, meta[name="description"], og:description
 */
function extractDescription($: cheerio.CheerioAPI): string | null {
  const descEl = $('.product-description, [class*="product-desc"]').first()
  if (descEl.length > 0) {
    const text = descEl.text().trim()
    if (text.length > 0) return text
  }

  // Fallback: meta description
  const metaDesc = $('meta[name="description"]').attr('content')?.trim()
  if (metaDesc && metaDesc.length > 0) return metaDesc

  // Fallback: og:description
  const ogDesc = $('meta[property="og:description"]').attr('content')?.trim()
  if (ogDesc && ogDesc.length > 0) return ogDesc

  return null
}

/**
 * Extracts specifications as key-value pairs from product parameters tables.
 */
function extractSpecs($: cheerio.CheerioAPI): Array<{ key: string; value: string }> {
  const specs: Array<{ key: string; value: string }> = []
  const seen = new Set<string>()

  // Try .product-parameters or .product-attributes table rows
  const tableSelectors = [
    '.product-parameters tr',
    '.product-attributes tr',
    '[class*="param"] tr',
    '[class*="attribute"] tr',
    '[class*="spec"] tr',
  ]

  for (const selector of tableSelectors) {
    $(selector).each((_, tr) => {
      const cells = $(tr).find('th, td')
      if (cells.length >= 2) {
        const key = $(cells[0]).text().trim()
        const value = $(cells[1]).text().trim()
        if (key && value && !seen.has(key)) {
          seen.add(key)
          specs.push({ key, value })
        }
      }
    })
  }

  // Try definition lists (dl/dt/dd)
  $('.product-parameters dl, .product-attributes dl, [class*="param"] dl').each((_, dl) => {
    $(dl).find('dt').each((_, dt) => {
      const key = $(dt).text().trim()
      const value = $(dt).next('dd').text().trim()
      if (key && value && !seen.has(key)) {
        seen.add(key)
        specs.push({ key, value })
      }
    })
  })

  // Try generic key-value divs
  $('[class*="param-item"], [class*="spec-item"]').each((_, item) => {
    const key = $(item).find('[class*="name"], [class*="label"], [class*="key"]').first().text().trim()
    const value = $(item).find('[class*="value"]').first().text().trim()
    if (key && value && !seen.has(key)) {
      seen.add(key)
      specs.push({ key, value })
    }
  })

  return specs
}

/**
 * Extracts datasheet PDF URLs from the page.
 * Looks for links ending in .pdf or containing 'datasheet'.
 */
function extractDatasheetUrls($: cheerio.CheerioAPI): string[] {
  const urls = new Set<string>()

  $('a').each((_, link) => {
    const href = $(link).attr('href')
    if (!href) return

    const text = $(link).text().toLowerCase()
    const hrefLower = href.toLowerCase()

    if (hrefLower.endsWith('.pdf') || hrefLower.includes('datasheet') || text.includes('datasheet')) {
      const normalized = normalizeUrl(href)
      if (normalized) urls.add(normalized)
    }
  })

  return Array.from(urls)
}

/**
 * Extracts product image URLs.
 * Looks for images in product gallery, og:image meta, and structured data.
 */
function extractImageUrls($: cheerio.CheerioAPI): string[] {
  const urls = new Set<string>()

  // Try product gallery images
  const gallerySelectors = [
    '[class*="product-gallery"] img',
    '[class*="product-image"] img',
    '[class*="productImage"] img',
    '[class*="gallery"] img',
    '.product-detail img',
  ]

  for (const selector of gallerySelectors) {
    $(selector).each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src')
      if (src) {
        const normalized = normalizeUrl(src)
        if (normalized && isImageUrl(normalized)) urls.add(normalized)
      }
    })
  }

  // Try og:image meta tag
  const ogImage = $('meta[property="og:image"]').attr('content')
  if (ogImage) {
    const normalized = normalizeUrl(ogImage)
    if (normalized && isImageUrl(normalized)) urls.add(normalized)
  }

  // Try structured data image
  $('[itemprop="image"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('content')
    if (src) {
      const normalized = normalizeUrl(src)
      if (normalized && isImageUrl(normalized)) urls.add(normalized)
    }
  })

  return Array.from(urls)
}

/**
 * Extracts manufacturer name from the page or specs.
 */
function extractManufacturer(
  $: cheerio.CheerioAPI,
  specs: Array<{ key: string; value: string }>,
): string | null {
  // Try .product-brand or similar
  const brandSelectors = [
    '.product-brand',
    '[class*="brand"]',
    '[class*="manufacturer"]',
    '[itemprop="brand"]',
    '[itemprop="manufacturer"]',
  ]

  for (const selector of brandSelectors) {
    const el = $(selector).first()
    if (el.length > 0) {
      const text = el.text().trim()
      if (text.length > 0) return text
    }
  }

  // Fallback: look in specs
  return extractFromSpecs(specs, ['manufacturer', 'brand', 'производитель'])
}

/**
 * Extracts LCSC part number from the page.
 */
function extractLcscPartNumber($: cheerio.CheerioAPI): string | null {
  // Try common selectors for LCSC part number
  const selectors = [
    '[class*="lcsc-part"]',
    '[class*="lcscPart"]',
    '[class*="part-number"]',
  ]

  for (const selector of selectors) {
    const el = $(selector).first()
    if (el.length > 0) {
      const text = el.text().trim()
      const match = text.match(/C\d+/)
      if (match) return match[0]
    }
  }

  // Try to find in page text (LCSC part numbers start with C followed by digits)
  const bodyText = $('body').text()
  const match = bodyText.match(/\bC\d{4,}\b/)
  if (match) return match[0]

  return null
}

/**
 * Searches specs array for a value matching one of the given key patterns.
 */
function extractFromSpecs(
  specs: Array<{ key: string; value: string }>,
  patterns: string[],
): string | null {
  for (const spec of specs) {
    const keyLower = spec.key.toLowerCase()
    for (const pattern of patterns) {
      if (keyLower.includes(pattern.toLowerCase())) {
        return spec.value
      }
    }
  }
  return null
}

/**
 * Normalizes a URL: handles protocol-relative and relative URLs.
 */
function normalizeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) return `https://www.lcsc.com${trimmed}`

  return null
}

/**
 * Checks if a URL looks like an image (by extension or known CDN patterns).
 */
function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase()
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']

  if (imageExtensions.some((ext) => lower.includes(ext))) return true

  // Known LCSC image CDN patterns
  if (lower.includes('assets.lcsc.com') || lower.includes('lcsc.com/img')) return true

  return false
}
