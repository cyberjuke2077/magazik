/**
 * LCSC Client
 *
 * Fetches product data from lcsc.com using CloakBrowser (stealth Chromium).
 * No proxy needed — LCSC is accessible directly.
 *
 * Features:
 * - Anti-detection: randomized viewport, resource blocking, locale 'en-US'
 * - Jitter: 5-10s between requests
 * - 403 handling: marks as blocked, returns null
 * - Single session (concurrency = 1)
 */

import { type EnrichmentResult } from '../types'
import { parseLcscProductPage } from './lcsc-parser'
import { registerBrowser, unregisterBrowser } from '../browser-registry'

export interface LcscClientConfig {
  /** No proxy needed — LCSC accessible without proxy */
}

export interface LcscClient {
  searchMpn(mpn: string, canonicalBrand: string): Promise<EnrichmentResult | null>
  close(): Promise<void>
}

/** Random integer in [min, max] inclusive */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Random jitter delay between 5-10 seconds */
function jitterDelay(): Promise<void> {
  const ms = randomInt(5000, 10000)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Generate a random viewport size for anti-detection */
function randomViewport(): { width: number; height: number } {
  const widths = [1280, 1366, 1440, 1536, 1600, 1920]
  const heights = [720, 768, 900, 864, 1024, 1080]
  return {
    width: widths[randomInt(0, widths.length - 1)],
    height: heights[randomInt(0, heights.length - 1)],
  }
}

/**
 * Creates an LCSC client with a CloakBrowser session.
 *
 * Uses dynamic import for ESM compatibility with cloakbrowser.
 * Launches browser WITHOUT proxy (confirmed accessible).
 */
export async function createLcscClient(): Promise<LcscClient> {
  const { launch } = await import('cloakbrowser')

  const viewport = randomViewport()

  const browser = await launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${viewport.width},${viewport.height}`,
    ],
  })
  registerBrowser(browser)

  const context = await browser.newContext({
    viewport,
    locale: 'en-US',
    timezoneId: 'America/New_York',
  })

  // Block images, fonts, stylesheets to reduce fingerprint and speed up
  await context.route('**/*', (route) => {
    const resourceType = route.request().resourceType()
    if (['image', 'font', 'stylesheet'].includes(resourceType)) {
      return route.abort()
    }
    return route.continue()
  })

  const page = await context.newPage()

  let isBlocked = false

  async function searchMpn(
    mpn: string,
    canonicalBrand: string,
  ): Promise<EnrichmentResult | null> {
    if (isBlocked) return null

    // Jitter before request
    await jitterDelay()

    const searchUrl = `https://www.lcsc.com/search?q=${encodeURIComponent(mpn)}`

    try {
      const searchResponse = await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      if (!searchResponse) return null

      const status = searchResponse.status()

      // Handle 403 — mark as blocked
      if (status === 403) {
        isBlocked = true
        return null
      }

      // Wait a moment for dynamic content
      await page.waitForTimeout(2000)

      // Look for product links in search results
      const productLink = await page.evaluate(() => {
        // LCSC search results typically have links to product pages
        const selectors = [
          'a[href*="/product-detail/"]',
          'a[href*="/product/"]',
          '[class*="product"] a[href]',
          '[class*="search-result"] a[href]',
        ]

        for (const selector of selectors) {
          const link = document.querySelector(selector) as HTMLAnchorElement | null
          if (link?.href) return link.href
        }

        return null
      })

      if (!productLink) return null

      // Navigate to product page
      await jitterDelay()

      const productResponse = await page.goto(productLink, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })

      if (!productResponse) return null

      if (productResponse.status() === 403) {
        isBlocked = true
        return null
      }

      // Wait for content to render
      await page.waitForTimeout(2000)

      // Get page HTML and parse
      const html = await page.content()
      const parsed = parseLcscProductPage(html)

      if (!parsed) return null

      // Map to EnrichmentResult
      const result: EnrichmentResult = {
        source: 'lcsc',
        mpn,
        brand: parsed.manufacturer || canonicalBrand,
        name: parsed.name || undefined,
        description: parsed.description || undefined,
        descriptionLanguage: 'en',
        specs: parsed.specs.length > 0 ? parsed.specs : undefined,
        imageUrls: parsed.imageUrls.length > 0 ? parsed.imageUrls : undefined,
        datasheetUrls: parsed.datasheetUrls.length > 0 ? parsed.datasheetUrls : undefined,
        lifecycle: parsed.lifecycle || undefined,
        package: parsed.package || undefined,
      }

      return result
    } catch (error) {
      // Network errors, timeouts — return null without blocking
      if (
        error instanceof Error &&
        error.message.includes('net::ERR_')
      ) {
        return null
      }
      return null
    }
  }

  async function close(): Promise<void> {
    try {
      await context.close()
    } catch {
      // Ignore close errors
    }
    try {
      await browser.close()
    } catch {
      // Ignore close errors
    }
    unregisterBrowser(browser)
  }

  return {
    searchMpn,
    close,
  }
}
