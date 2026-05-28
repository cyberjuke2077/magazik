/**
 * LCSC Client (CloakBrowser SPA + JSON-LD)
 *
 * lcsc.com is a Nuxt SPA. The search route hydrates client-side, so we need
 * a real browser. After the SPA resolves, the product detail page contains
 * a stable JSON-LD Product block — that is the source of truth here.
 *
 * Pipeline:
 *   1. goto /search?q={mpn} — Nuxt SPA may redirect to /category/...
 *      when there is a single full-match.
 *   2. waitForFunction: either a product-detail link appears, OR a
 *      "no result" indicator is visible. No fixed sleeps.
 *   3. Pick the link whose title best matches the canonical MPN
 *      (exact > prefix > first).
 *   4. goto product page, parse JSON-LD Product block.
 *
 * Why CloakBrowser:
 *   Resource blocking (route.abort on images/fonts/stylesheets) breaks
 *   Nuxt hydration on LCSC — leave everything enabled.
 */

import type { Browser, BrowserContext, Page } from 'playwright-core'

import { type EnrichmentResult } from '../types'
import { registerBrowser, unregisterBrowser } from '../browser-registry'

export type LcscClientConfig = Record<string, never>

export interface LcscClient {
  searchMpn(mpn: string, canonicalBrand: string): Promise<EnrichmentResult | null>
  isBlocked(): boolean
  close(): Promise<void>
}

const SEARCH_TIMEOUT_MS = 40_000
const PDP_HYDRATION_DELAY_MS = 1_200
const MIN_DELAY_MS = 1_500
const MAX_DELAY_MS = 3_500

/** JSON-LD shape we care about. Optional fields cover both LCSC variants. */
interface JsonLdBrand {
  '@type'?: string
  name?: string
}
interface JsonLdProperty {
  '@type'?: string
  name?: string
  value?: string | number
}
interface JsonLdSubject {
  '@type'?: string
  name?: string
  url?: string
}
interface JsonLdProduct {
  '@type'?: string
  name?: string
  sku?: string
  mpn?: string
  brand?: JsonLdBrand | string
  description?: string
  image?: string[] | string
  category?: string
  additionalProperty?: JsonLdProperty[]
  subjectOf?: JsonLdSubject | JsonLdSubject[]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function jitter(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, randomInt(MIN_DELAY_MS, MAX_DELAY_MS)))
}

function brandToString(brand: JsonLdBrand | string | undefined): string | null {
  if (!brand) return null
  if (typeof brand === 'string') return brand.trim() || null
  return brand.name?.trim() || null
}

function collectImages(image: string[] | string | undefined): string[] {
  if (!image) return []
  const arr = Array.isArray(image) ? image : [image]
  return Array.from(new Set(arr.map((s) => s.trim()).filter(Boolean)))
}

function collectDatasheets(subjectOf: JsonLdSubject | JsonLdSubject[] | undefined): string[] {
  if (!subjectOf) return []
  const arr = Array.isArray(subjectOf) ? subjectOf : [subjectOf]
  return arr
    .filter((s) => s?.url && (s['@type'] === 'DigitalDocument' || /datasheet/i.test(s.name || '')))
    .map((s) => s.url as string)
}

function collectSpecs(props: JsonLdProperty[] | undefined): Array<{ key: string; value: string }> {
  if (!props || props.length === 0) return []
  const out: Array<{ key: string; value: string }> = []
  const seen = new Set<string>()
  for (const p of props) {
    const key = (p.name || '').trim()
    const value = p.value === undefined || p.value === null ? '' : String(p.value).trim()
    if (key && value && !seen.has(key)) {
      seen.add(key)
      out.push({ key, value })
    }
  }
  return out
}

/**
 * Extract the first JSON-LD block of the given @type from a page HTML.
 * LCSC product pages embed multiple blocks (Product, ImageObject, BreadcrumbList);
 * we want Product.
 */
function extractJsonLdProduct(html: string): JsonLdProduct | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const body = m[1].trim()
    if (!body) continue
    try {
      const parsed = JSON.parse(body) as JsonLdProduct
      if (parsed['@type'] === 'Product') return parsed
    } catch {
      // skip malformed block
    }
  }
  return null
}

/**
 * Wait for the LCSC SPA to either show product-detail links or signal
 * "no results". Returns the outcome so the caller can branch cleanly.
 */
async function waitForSearchResolution(page: Page): Promise<'product' | 'empty' | 'timeout'> {
  try {
    await page.waitForFunction(
      () => {
        if (document.querySelector('a[href*="/product-detail/"]')) return 'product'
        const text = document.body?.innerText || ''
        if (/0\s*results|no result|no products|没有找到|未找到/i.test(text)) return 'empty'
        return false
      },
      { timeout: SEARCH_TIMEOUT_MS },
    )
  } catch {
    return 'timeout'
  }
  const hasProduct = await page.evaluate(
    () => !!document.querySelector('a[href*="/product-detail/"]'),
  )
  return hasProduct ? 'product' : 'empty'
}

/**
 * From all rendered product-detail links, pick the one whose title best
 * matches the canonical MPN. Falls back to prefix match, then first link.
 */
async function pickBestLink(page: Page, mpn: string): Promise<string | null> {
  const target = mpn.toUpperCase()
  return page.evaluate((tgt: string) => {
    const links = Array.from(document.querySelectorAll('a[href*="/product-detail/"]'))
      .map((a) => ({
        href: (a as HTMLAnchorElement).href,
        title: (a.getAttribute('title') || a.textContent || '').trim(),
      }))
      .filter((l) => /\/product-detail\/C\d+\.html/.test(l.href))
    if (links.length === 0) return null
    const exact = links.find((l) => l.title.toUpperCase() === tgt)
    if (exact) return exact.href
    const prefix = links.find((l) => l.title.toUpperCase().startsWith(tgt))
    if (prefix) return prefix.href
    return links[0].href
  }, target)
}

/**
 * Map a parsed JSON-LD Product into the pipeline's EnrichmentResult.
 * Caller supplies fallback brand/mpn for the rare case JSON-LD lacks them.
 */
function mapProductToResult(
  product: JsonLdProduct,
  fallbackMpn: string,
  fallbackBrand: string,
): EnrichmentResult {
  const specs = collectSpecs(product.additionalProperty)
  const images = collectImages(product.image)
  const datasheets = collectDatasheets(product.subjectOf)
  const pkg = specs.find((s) => /^package$/i.test(s.key))?.value
  return {
    source: 'lcsc',
    mpn: product.mpn?.trim() || fallbackMpn,
    brand: brandToString(product.brand) || fallbackBrand,
    name: product.name?.trim() || undefined,
    description: product.description?.trim() || undefined,
    descriptionLanguage: 'en',
    categoryName: product.category?.trim() || undefined,
    specs: specs.length > 0 ? specs : undefined,
    imageUrls: images.length > 0 ? images : undefined,
    datasheetUrls: datasheets.length > 0 ? datasheets : undefined,
    package: pkg,
  }
}

/**
 * Create an LCSC client backed by a single CloakBrowser session.
 * The client is sequential — call sites must not invoke searchMpn in parallel.
 */
export async function createLcscClient(): Promise<LcscClient> {
  const { launch } = (await import('cloakbrowser')) as typeof import('cloakbrowser')

  const browser: Browser = await launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  })
  registerBrowser(browser)

  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  })
  // No resource blocking — LCSC's Nuxt SPA fails to hydrate without CSS/JS.

  const page: Page = await context.newPage()
  let isBlocked = false

  async function searchMpn(
    mpn: string,
    canonicalBrand: string,
  ): Promise<EnrichmentResult | null> {
    if (isBlocked) return null
    if (!mpn || mpn.trim().length === 0) return null

    await jitter()

    const searchUrl = `https://www.lcsc.com/search?q=${encodeURIComponent(mpn)}`
    let resp
    try {
      resp = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    } catch {
      return null
    }
    if (!resp) return null
    if (resp.status() === 403 || resp.status() === 429) {
      isBlocked = true
      return null
    }

    const outcome = await waitForSearchResolution(page)
    if (outcome !== 'product') return null

    const link = await pickBestLink(page, mpn)
    if (!link) return null

    await jitter()

    try {
      const pdpResp = await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      if (!pdpResp) return null
      if (pdpResp.status() === 403 || pdpResp.status() === 429) {
        isBlocked = true
        return null
      }
    } catch {
      return null
    }

    await page.waitForTimeout(PDP_HYDRATION_DELAY_MS)

    const html = await page.content()
    const product = extractJsonLdProduct(html)
    if (!product) return null

    return mapProductToResult(product, mpn, canonicalBrand)
  }

  async function close(): Promise<void> {
    try {
      await context.close()
    } catch {
      // ignore
    }
    try {
      await browser.close()
    } catch {
      // ignore
    }
    unregisterBrowser(browser)
  }

  return { searchMpn, isBlocked: () => isBlocked, close }
}
