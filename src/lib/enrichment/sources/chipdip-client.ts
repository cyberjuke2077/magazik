/**
 * ChipDip Client Module
 *
 * Provides CloakBrowser-based scraping of chipdip.ru for product enrichment.
 * Uses stealth Chromium (cloakbrowser) without proxy by default.
 * Proxy is an optional fallback when 403/CAPTCHA is detected.
 *
 * Anti-detection measures (maximum stealth):
 * - Randomized viewport per session
 * - NO resource blocking — loads everything like a real browser
 * - Russian locale and Moscow timezone
 * - Extended jitter delay (20-45s) between requests
 * - Random additional micro-delays on page load (1-3s)
 * - waitUntil: 'networkidle' for realistic page load behavior
 * - Max 180 requests/hour (self-imposed rate limit)
 * - Session rotation every 50 requests (new viewport, fresh context)
 */

import * as cheerio from 'cheerio'
import type { Browser, BrowserContext, Page } from 'playwright-core'

import { parseProductPage } from '../../parser/product-parser'
import type { ParsedProduct } from '../../parser/types'
import { type EnrichmentResult } from '../types'
import { registerBrowser, unregisterBrowser } from '../browser-registry'
import { getCaptchaSolver } from '../../captcha/2captcha-solver'
import { normalizeMpn } from '../ingest/mpn-normalizer'

/** Configuration for ChipDip client */
export interface ChipDipClientConfig {
  /** Proxy URL template with {N} placeholder for residential rotator */
  proxyTemplate?: string
  /** Direct proxy URL (alternative to template) */
  proxyUrl?: string
  /** Range [min, max] for {N} in proxy template */
  proxyUserRange: [number, number]
  /** Number of concurrent sessions (1-3) */
  concurrency: number
  /** Random delay between completed product lookups */
  requestDelayRange?: [number, number]
  /** Random delay between pages within one lookup */
  pageDelayRange?: [number, number]
}

/** ChipDip client interface */
export interface ChipDipClient {
  /** Verify ChipDip is accessible and returns search results */
  healthCheck(): Promise<boolean>
  /** Search for a product by MPN and return enrichment result */
  searchMpn(mpn: string, canonicalBrand: string): Promise<EnrichmentResult | null>
  /** Close browser instance and release resources */
  close(): Promise<void>
}

/** Common viewport sizes for randomization */
const VIEWPORT_SIZES = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 1280, height: 800 },
  { width: 1680, height: 1050 },
]

/** Maximum number of search results inspected before declaring no exact MPN match. */
const MAX_PRODUCT_CANDIDATES = 5

export function isMatchingChipDipProduct(
  requestedMpn: string,
  parsedPartNumber: string | null,
): boolean {
  if (!parsedPartNumber) return false
  return normalizeMpn(parsedPartNumber) === normalizeMpn(requestedMpn)
}

export function buildChipDipDescription(product: ParsedProduct): string {
  const sourceDescription = product.description?.trim()
  if (sourceDescription) return sourceDescription

  const parts = [product.name.trim()]
  if (product.partNumber) parts.push(`MPN: ${product.partNumber}.`)
  if (product.manufacturer) parts.push(`Производитель: ${product.manufacturer}.`)

  const category =
    product.categoryPath.length > 0
      ? product.categoryPath.join(' / ')
      : product.category
  if (category) parts.push(`Категория: ${category}.`)

  const mainSpecs = Object.entries(product.specifications).slice(0, 8)
  if (mainSpecs.length > 0) {
    parts.push(
      `Основные характеристики: ${mainSpecs
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ')}.`,
    )
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/** Resource types to block for reduced fingerprint and traffic */
// DISABLED: Loading all resources like a real browser for maximum stealth
// const BLOCKED_RESOURCE_TYPES = ['image', 'font', 'stylesheet']

/**
 * Generates a random jitter delay between 20-45 seconds.
 * Longer delays = more human-like, less suspicious.
 */
function getJitterMs(range: [number, number] = [20_000, 45_000]): number {
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
}

/**
 * Random micro-delay after page load (1-3 seconds).
 * Simulates human reading/scanning the page before next action.
 */
function getMicroDelayMs(range: [number, number] = [1_000, 3_000]): number {
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
}

/** Counter for session rotation */
const SESSION_ROTATION_INTERVAL = 50

/**
 * Picks a random viewport from the predefined list
 */
function getRandomViewport(): { width: number; height: number } {
  const index = Math.floor(Math.random() * VIEWPORT_SIZES.length)
  return VIEWPORT_SIZES[index]
}

/**
 * Builds a proxy URL from template by replacing {N} with a random number
 * from the given range.
 */
function buildProxyUrl(template: string, range: [number, number]): string {
  const [min, max] = range
  const n = Math.floor(Math.random() * (max - min + 1)) + min
  return template.replace('{N}', String(n))
}

/**
 * Block reason code returned by `detectBlock`. Recorded in
 * `EnrichmentJournal.errorMessage` when status flips to `chipdip_blocked` so
 * that operators can distinguish IP-bans from CAPTCHA challenges and tune
 * the response (rotate proxy, slow down, etc.).
 */
export type BlockReason =
  | 'http-403'
  | 'http-503-cf'
  | 'cf-challenge-form'
  | 'cf-challenge-running'
  | 'cf-iframe'
  | 'title-match'
  | 'cdn-cgi-redirect'

export interface BlockResult {
  blocked: boolean
  reason?: BlockReason
}

const TITLE_BLOCK_RE = /cloudflare|just a moment|access denied|доступ ограничен/

/**
 * Structural block detector.
 *
 * Replaces the legacy substring-based `isBlocked` which produced false
 * positives on legitimate ChipDip pages mentioning `captcha` or
 * `access denied` (e.g. an RFID module page describing an Access Denied
 * LED indicator).
 *
 * Indicators are checked in strict priority order; the first match wins.
 */
export function detectBlock(args: {
  status: number
  html: string
  headers?: Record<string, string>
  finalUrl?: string
}): BlockResult {
  const { status, html, headers, finalUrl } = args

  if (status === 403) {
    return { blocked: true, reason: 'http-403' }
  }

  if (status === 503 && headers) {
    const hasCfHeader = Object.keys(headers).some(k => k.toLowerCase().startsWith('cf-'))
    if (hasCfHeader) {
      return { blocked: true, reason: 'http-503-cf' }
    }
  }

  if (finalUrl && finalUrl.includes('/cdn-cgi/')) {
    return { blocked: true, reason: 'cdn-cgi-redirect' }
  }

  if (!html) {
    return { blocked: false }
  }

  const $ = cheerio.load(html)

  if ($('form#challenge-form').length > 0) {
    return { blocked: true, reason: 'cf-challenge-form' }
  }

  if ($('div#cf-challenge-running').length > 0) {
    return { blocked: true, reason: 'cf-challenge-running' }
  }

  if ($('iframe[src*="captcha"], iframe[src*="cloudflare"]').length > 0) {
    // Passive Cloudflare Turnstile widget is embedded on many normal pages
    // (chipdip uses it). It is NOT a block by itself — only flag if the
    // page also lacks real product/search content. Real CF challenge pages
    // are caught earlier by challenge-form/challenge-running/title-match.
    const hasRealContent =
      $('a[href*="/product/"]').length > 0 ||
      $('.product, .product__name, #productparams').length > 0 ||
      $('main, #content, .content').length > 0
    if (!hasRealContent) {
      return { blocked: true, reason: 'cf-iframe' }
    }
  }

  const title = $('title').text().toLowerCase()
  if (TITLE_BLOCK_RE.test(title)) {
    return { blocked: true, reason: 'title-match' }
  }

  return { blocked: false }
}

/**
 * Backwards-compatible wrapper around `detectBlock`. Kept so existing call
 * sites and tests that only care about the boolean continue to work.
 */
export function isBlocked(status: number, html: string): boolean {
  return detectBlock({ status, html }).blocked
}

/**
 * Waits for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Attempts to solve a Cloudflare Turnstile challenge on the current page
 * using the configured captcha solver (rucaptcha/2captcha).
 *
 * Returns true if a token was obtained and injected into the page; false
 * if no challenge widget was found or solving failed. Caller should reload
 * the page after a successful solve.
 *
 * Designed to fail-soft: any error from the solver returns false, never
 * throws. The solver itself only fails if `CAPTCHA_2CAPTCHA_API_KEY` is
 * missing — in that case we silently skip.
 */
async function trySolveTurnstile(page: Page): Promise<boolean> {
  try {
    const html = await page.content()
    const $ = cheerio.load(html)

    // Find Turnstile sitekey from the iframe src or data-sitekey attribute
    let sitekey: string | undefined
    const tsIframe = $('iframe[src*="challenges.cloudflare.com"]').first()
    if (tsIframe.length > 0) {
      const src = tsIframe.attr('src') ?? ''
      const match = src.match(/\/turnstile\/.*?\/([0-9A-Za-z_-]{20,})/)
      if (match) sitekey = match[1]
    }
    if (!sitekey) {
      const ts = $('[data-sitekey]').first()
      sitekey = ts.attr('data-sitekey')
    }
    if (!sitekey) return false

    const pageUrl = page.url()
    const solver = getCaptchaSolver()
    const result = await solver.solveTurnstile(sitekey, pageUrl)
    if (!result.success || !result.token) return false

    // Inject the token into the cf-turnstile-response field if present.
    await page.evaluate((token) => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="cf-turnstile-response"]',
      )
      inputs.forEach((input) => {
        input.value = token
      })
    }, result.token)
    return true
  } catch {
    return false
  }
}

/**
 * Creates a ChipDip client with CloakBrowser for stealth scraping.
 *
 * Launches browser WITHOUT proxy by default. If 403 is detected and
 * proxy is configured, relaunches with proxy as fallback.
 *
 * @param config - Client configuration
 * @returns ChipDipClient instance
 */
export async function createChipDipClient(config: ChipDipClientConfig): Promise<ChipDipClient> {
  // Dynamic import for ESM-only cloakbrowser package
  const { launch } = await import('cloakbrowser')

  /**
   * Launches a fresh stealth Browser + Context + Page.
   * Registers the Browser so it is force-closed on process exit.
   */
  async function spawn(
    proxyUrl?: string,
  ): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    const vp = getRandomViewport()
    const browser = await launch({
      headless: true,
      locale: 'ru-RU',
      timezone: 'Europe/Moscow',
      ...(proxyUrl ? { proxy: proxyUrl } : {}),
    })
    registerBrowser(browser)
    const context = await browser.newContext({ viewport: vp })
    const page = await context.newPage()
    return { browser, context, page }
  }

  /**
   * Closes the current browser cleanly and removes it from the registry.
   */
  async function teardown(browser: Browser): Promise<void> {
    try {
      await browser.close()
    } catch {
      // ignore
    }
    unregisterBrowser(browser)
  }

  let { browser, context, page } = await spawn()
  void context

  // NO resource blocking — load everything like a real browser
  // This makes us look more like a genuine user

  let usingProxy = false
  let requestCount = 0

  /**
   * Relaunches browser with proxy configuration. Closes the previous
   * browser BEFORE spawning the new one to avoid leaking Chromium processes.
   */
  async function relaunchWithProxy(): Promise<void> {
    let proxyUrl: string | undefined
    if (config.proxyTemplate) {
      proxyUrl = buildProxyUrl(config.proxyTemplate, config.proxyUserRange)
    } else if (config.proxyUrl) {
      proxyUrl = config.proxyUrl
    }

    if (!proxyUrl) {
      throw new Error('ChipDip blocked (403/CAPTCHA) and no proxy configured')
    }

    const old = browser
    const next = await spawn(proxyUrl)
    browser = next.browser
    context = next.context
    page = next.page
    await teardown(old)
    usingProxy = true
  }

  /**
   * Rotates to a fresh stealth session (new fingerprint, new browser).
   * Closes the previous browser to release its Chromium process.
   */
  async function rotateSession(proxyUrl?: string): Promise<void> {
    const old = browser
    const next = await spawn(proxyUrl)
    browser = next.browser
    context = next.context
    page = next.page
    await teardown(old)
    requestCount = 0
  }

  /**
   * Checks if proxy is available for fallback
   */
  function hasProxy(): boolean {
    return !!(config.proxyTemplate || config.proxyUrl)
  }

  const client: ChipDipClient = {
    async healthCheck(): Promise<boolean> {
      try {
        const url = 'https://www.chipdip.ru/search?searchtext=STM32F469ZIT6'
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' })

        if (!response) return false

        const status = response.status()
        const headers = response.headers()
        const finalUrl = response.url()
        const html = await page.content()

        if (detectBlock({ status, html, headers, finalUrl }).blocked) {
          return false
        }

        if (status !== 200) return false

        // Verify HTML contains product links
        return html.includes('/product/')
      } catch {
        return false
      }
    },

    async searchMpn(mpn: string, canonicalBrand: string): Promise<EnrichmentResult | null> {
      // Session rotation: every N requests, create fresh context (new fingerprint)
      requestCount++
      if (requestCount > SESSION_ROTATION_INTERVAL && !usingProxy) {
        await rotateSession()
      }

      const searchUrl = `https://www.chipdip.ru/search?searchtext=${encodeURIComponent(mpn)}`

      // Navigate to search page — use domcontentloaded (networkidle hangs on chipdip
      // due to long-lived analytics/pixel trackers that never go idle).
      const response = await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      })

      if (!response) {
        throw new Error(`ChipDip search failed: no response for ${mpn}`)
      }

      const status = response.status()
      const headers = response.headers()
      const finalUrl = response.url()
      let html = await page.content()

      // Handle 403/CAPTCHA on search page
      if (detectBlock({ status, html, headers, finalUrl }).blocked) {
        // First: try rotating session (new fingerprint) before declaring blocked
        await rotateSession()

        // Wait a bit before retry
        await sleep(5000)

        // Retry with fresh session
        const retryResponse = await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        })
        if (!retryResponse) {
          throw new Error(`ChipDip search failed: no response on retry for ${mpn}`)
        }
        const retryStatus = retryResponse.status()
        const retryHeaders = retryResponse.headers()
        const retryFinalUrl = retryResponse.url()
        html = await page.content()

        // If still blocked after session rotation — try to solve captcha
        // before giving up. Real CF challenge pages have a Turnstile widget;
        // rucaptcha/2captcha can solve it for ~$0.001 per call.
        const retryBlock = detectBlock({
          status: retryStatus,
          html,
          headers: retryHeaders,
          finalUrl: retryFinalUrl,
        })
        if (retryBlock.blocked) {
          // Attempt captcha solve once before falling back to proxy/error
          const solved = await trySolveTurnstile(page)
          if (solved) {
            // Reload the page; if the token was accepted, content is now real.
            const reloadResp = await page.goto(searchUrl, {
              waitUntil: 'domcontentloaded',
              timeout: 30_000,
            })
            if (reloadResp) {
              html = await page.content()
              const reloadBlock = detectBlock({
                status: reloadResp.status(),
                html,
                headers: reloadResp.headers(),
                finalUrl: reloadResp.url(),
              })
              if (!reloadBlock.blocked) {
                // Captcha worked — fall through and parse normally
              } else if (hasProxy() && !usingProxy) {
                await relaunchWithProxy()
                const proxyResponse = await page.goto(searchUrl, {
                  waitUntil: 'domcontentloaded',
                })
                if (!proxyResponse) {
                  throw new Error(`ChipDip search failed after proxy switch for ${mpn}`)
                }
                html = await page.content()
                const proxyBlock = detectBlock({
                  status: proxyResponse.status(),
                  html,
                  headers: proxyResponse.headers(),
                  finalUrl: proxyResponse.url(),
                })
                if (proxyBlock.blocked) {
                  throw new Error(
                    `ChipDip blocked (403/CAPTCHA): ${proxyBlock.reason} (proxy+captcha) for ${mpn}`,
                  )
                }
              } else {
                throw new Error(
                  `ChipDip blocked (403/CAPTCHA): ${reloadBlock.reason} (after captcha) for ${mpn}`,
                )
              }
            }
          } else if (hasProxy() && !usingProxy) {
            await relaunchWithProxy()
            const proxyResponse = await page.goto(searchUrl, { waitUntil: 'domcontentloaded' })
            if (!proxyResponse) {
              throw new Error(`ChipDip search failed after proxy switch for ${mpn}`)
            }
            const proxyStatus = proxyResponse.status()
            const proxyHeaders = proxyResponse.headers()
            const proxyFinalUrl = proxyResponse.url()
            html = await page.content()
            const proxyBlock = detectBlock({
              status: proxyStatus,
              html,
              headers: proxyHeaders,
              finalUrl: proxyFinalUrl,
            })
            if (proxyBlock.blocked) {
              throw new Error(
                `ChipDip blocked (403/CAPTCHA): ${proxyBlock.reason} (even with proxy) for ${mpn}`,
              )
            }
          } else {
            throw new Error(`ChipDip blocked (403/CAPTCHA): ${retryBlock.reason} for ${mpn}`)
          }
        }
      }

      // Extract product links from search results using cheerio
      const $ = cheerio.load(html)
      const productLinks: string[] = []

      $('a[href*="/product/"]').each((_, el) => {
        const href = $(el).attr('href')
        if (href && href.includes('/product/')) {
          productLinks.push(href)
        }
      })

      // No product links found → not found on ChipDip
      if (productLinks.length === 0) {
        // Apply jitter before returning
        await sleep(getJitterMs(config.requestDelayRange))
        return null
      }

      const candidates = Array.from(new Set(productLinks)).slice(
        0,
        MAX_PRODUCT_CANDIDATES,
      )

      for (const candidate of candidates) {
        await sleep(getMicroDelayMs(config.pageDelayRange))

        const productUrl = candidate.startsWith('http')
          ? candidate
          : `https://www.chipdip.ru${candidate}`

        const productResponse = await page.goto(productUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        })
        if (!productResponse) continue

        const productFinalUrl = productResponse.url()
        const productHtml = await page.content()
        if (
          detectBlock({
            status: productResponse.status(),
            html: productHtml,
            headers: productResponse.headers(),
            finalUrl: productFinalUrl,
          }).blocked
        ) {
          continue
        }

        await sleep(getMicroDelayMs(config.pageDelayRange))
        const parseResult = parseProductPage(productHtml)
        if (!parseResult.success || !parseResult.data) continue

        const parsed = parseResult.data
        if (!isMatchingChipDipProduct(mpn, parsed.partNumber)) continue

        const result: EnrichmentResult = {
          source: 'chipdip',
          mpn,
          brand: canonicalBrand,
          name: parsed.name || undefined,
          description: buildChipDipDescription(parsed),
          descriptionLanguage: 'ru',
          sku: parsed.sku || undefined,
          weight: parsed.weight ?? undefined,
          price: parsed.price ?? undefined,
          currency: parsed.currency ?? undefined,
          categoryName: parsed.category || undefined,
          categoryPath: parsed.categoryPath.length > 0 ? parsed.categoryPath : undefined,
          specs: Object.entries(parsed.specifications).map(([key, value]) => ({
            key,
            value,
          })),
          imageUrls: parsed.images.length > 0 ? parsed.images : undefined,
          datasheetUrls: parsed.datasheets.length > 0 ? parsed.datasheets : undefined,
          package: undefined,
        }

        await sleep(getJitterMs(config.requestDelayRange))
        return result
      }

      await sleep(getJitterMs(config.requestDelayRange))
      return null
    },

    async close(): Promise<void> {
      await teardown(browser)
    },
  }

  return client
}
