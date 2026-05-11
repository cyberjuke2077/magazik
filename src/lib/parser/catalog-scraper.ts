/**
 * Catalog Scraper Module
 * 
 * Extracts product URLs from ChipDip catalog pages.
 * Pure functions with no side effects for easy testing.
 * 
 * Features:
 * - Extract product URLs from catalog HTML
 * - Extract pagination information
 * - Validate and normalize product slugs
 * - Handle malformed HTML gracefully
 */

import * as cheerio from 'cheerio'

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalProducts: number
  hasNextPage: boolean
}

export interface CatalogScraperResult {
  productSlugs: string[]
  pagination: PaginationInfo | null
}

/**
 * Extracts product slugs from catalog page HTML
 * 
 * @param html - Catalog page HTML content
 * @returns Array of product slugs (e.g., ["stm32f103c8t6", "atmega328p"])
 */
export function scrapeCatalogPage(html: string): string[] {
  if (!html || html.trim().length === 0) {
    return []
  }

  try {
    const $ = cheerio.load(html)
    
    // Extract product URLs from catalog listing
    // ChipDip uses links in format: /product/{slug} or /product/{slug}/
    const productLinks = $('a[href*="/product/"]')
      .map((_, el) => $(el).attr('href'))
      .toArray()
      .filter((href): href is string => typeof href === 'string')
    
    // Extract slugs from URLs and deduplicate
    const slugs = productLinks
      .map(extractSlugFromUrl)
      .filter((slug): slug is string => slug !== null)
      .filter((slug, index, self) => self.indexOf(slug) === index) // Remove duplicates
    
    return slugs
  } catch (error) {
    console.error('Failed to parse catalog HTML:', error)
    return []
  }
}

/**
 * Extracts product slug from URL
 * 
 * @param url - Product URL (e.g., "/product/stm32f103c8t6" or "https://www.chipdip.ru/product/stm32f103c8t6/")
 * @returns Product slug or null if invalid
 */
export function extractSlugFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  try {
    // Match /product/{slug} pattern
    const match = url.match(/\/product\/([^/?#]+)/)
    
    if (!match || !match[1]) {
      return null
    }
    
    const slug = match[1].trim().toLowerCase()
    
    // Validate slug (alphanumeric, hyphens, underscores only)
    if (!isValidSlug(slug)) {
      return null
    }
    
    return slug
  } catch (error) {
    return null
  }
}

/**
 * Validates product slug format
 * 
 * @param slug - Product slug to validate
 * @returns True if slug is valid
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length === 0 || slug.length > 200) {
    return false
  }
  
  // Allow alphanumeric, hyphens, underscores
  const validPattern = /^[a-z0-9_-]+$/
  return validPattern.test(slug)
}

/**
 * Extracts pagination information from catalog page
 * 
 * @param html - Catalog page HTML content
 * @returns Pagination info or null if not found
 */
export function extractPaginationInfo(html: string): PaginationInfo | null {
  if (!html || html.trim().length === 0) {
    return null
  }

  try {
    const $ = cheerio.load(html)
    
    // Try to find pagination elements
    // Common patterns: .pagination, .pager, page numbers
    const paginationContainer = $('.pagination, .pager, [class*="pagination"]').first()
    
    if (paginationContainer.length === 0) {
      return null
    }
    
    // Extract page numbers from pagination links
    const pageNumbers = paginationContainer
      .find('a, span')
      .map((_, el) => {
        const text = $(el).text().trim()
        const num = parseInt(text, 10)
        return isNaN(num) ? null : num
      })
      .toArray()
      .filter((num): num is number => num !== null)
    
    if (pageNumbers.length === 0) {
      return null
    }
    
    const totalPages = Math.max(...pageNumbers)
    
    // Try to find current page (usually has active/current class)
    const currentPageText = paginationContainer
      .find('.active, .current, [class*="active"], [class*="current"]')
      .first()
      .text()
      .trim()
    
    const currentPage = parseInt(currentPageText, 10) || 1
    
    // Try to extract total products count
    // Common patterns: "Найдено: 395850 товаров", "395,850 products"
    const totalProducts = extractTotalProductsCount($)
    
    return {
      currentPage,
      totalPages,
      totalProducts,
      hasNextPage: currentPage < totalPages,
    }
  } catch (error) {
    console.error('Failed to extract pagination info:', error)
    return null
  }
}

/**
 * Extracts total products count from page
 * 
 * @param $ - Cheerio instance
 * @returns Total products count or 0 if not found
 */
function extractTotalProductsCount($: cheerio.CheerioAPI): number {
  // Look for common patterns in text
  const bodyText = $('body').text()
  
  // Pattern: "Найдено: 395850" or "395,850 товаров"
  // Use non-greedy match and word boundaries to avoid capturing page numbers
  const patterns = [
    /найдено[:\s]+([\d,]+)/i,
    /(\d[\d,]*)\s+товар/gi, // Use global flag to find all matches
    /total[:\s]+([\d,]+)/i,
  ]
  
  for (const pattern of patterns) {
    // For global patterns, find all matches and pick the largest number
    if (pattern.global) {
      const matches = Array.from(bodyText.matchAll(pattern))
      const numbers = matches
        .map(match => {
          const numStr = match[1].replace(/,/g, '')
          return parseInt(numStr, 10)
        })
        .filter(num => !isNaN(num) && num > 0)
      
      if (numbers.length > 0) {
        // Return the largest number (likely total products, not page numbers)
        return Math.max(...numbers)
      }
    } else {
      const match = bodyText.match(pattern)
      if (match && match[1]) {
        const numStr = match[1].replace(/,/g, '')
        const num = parseInt(numStr, 10)
        if (!isNaN(num) && num > 0) {
          return num
        }
      }
    }
  }
  
  return 0
}

/**
 * Scrapes catalog page and returns structured result
 * 
 * @param html - Catalog page HTML content
 * @returns Catalog scraper result with product slugs and pagination
 */
export function scrapeCatalog(html: string): CatalogScraperResult {
  return {
    productSlugs: scrapeCatalogPage(html),
    pagination: extractPaginationInfo(html),
  }
}
