import { type DataSource, type EnrichmentResult } from '../types'

/**
 * Configuration for the Mouser API client.
 */
export interface MouserClientConfig {
  apiKey: string
}

/**
 * Error thrown when Mouser API daily quota is exhausted (HTTP 429 or 1000 calls reached).
 */
export class QuotaExhaustedError extends Error {
  constructor(message = 'Mouser API daily quota exhausted') {
    super(message)
    this.name = 'QuotaExhaustedError'
  }
}

/**
 * Mouser API client interface for searching parts by MPN.
 */
export interface MouserClient {
  searchByPartNumber(mpn: string, canonicalBrand: string): Promise<EnrichmentResult | null>
  getDailyQuotaUsed(): number
  isQuotaExhausted(): boolean
}

/** Maximum daily API calls allowed by Mouser free tier */
const DAILY_QUOTA_LIMIT = 1000

/** Delay between consecutive API calls (ms) */
const CALL_DELAY_MS = 1000

/** Retry delays for 5xx errors (ms) */
const RETRY_DELAYS = [5000, 15000, 45000]

/** Mouser Search API base URL */
const MOUSER_API_URL = 'https://api.mouser.com/api/v1/search/partnumber'

/**
 * Masks an API key for safe logging: shows first 4 chars + ***.
 */
function maskApiKey(key: string): string {
  if (key.length <= 4) return '***'
  return key.slice(0, 4) + '***'
}

/**
 * Delays execution for the specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mouser API part result shape (subset of fields we use).
 */
interface MouserPart {
  Manufacturer: string
  ManufacturerPartNumber: string
  MouserPartNumber: string
  Description: string
  DataSheetUrl?: string
  ImagePath?: string
  LifecycleStatus?: string
  Category?: string
  ProductDetailUrl?: string
}

/**
 * Mouser API search response shape.
 */
interface MouserSearchResponse {
  SearchResults?: {
    Parts?: MouserPart[]
  }
}

/**
 * Creates a Mouser API client instance.
 *
 * - POST to Mouser Search API with part number
 * - Brand matching: first result where Manufacturer matches canonicalBrand (case-insensitive)
 * - Daily quota tracking (in-memory, resets on new day)
 * - Retry: 429 → throw QuotaExhaustedError; 5xx → retry 3x (5/15/45s)
 * - 1 second delay between calls
 * - API key masked in error messages
 *
 * @param config - Client configuration with API key
 * @returns MouserClient instance
 */
export function createMouserClient(config: MouserClientConfig): MouserClient {
  let dailyQuotaUsed = 0
  let lastCallDate = new Date().toISOString().slice(0, 10)
  let lastCallTime = 0

  function resetQuotaIfNewDay(): void {
    const today = new Date().toISOString().slice(0, 10)
    if (today !== lastCallDate) {
      dailyQuotaUsed = 0
      lastCallDate = today
    }
  }

  function isQuotaExhausted(): boolean {
    resetQuotaIfNewDay()
    return dailyQuotaUsed >= DAILY_QUOTA_LIMIT
  }

  function getDailyQuotaUsed(): number {
    resetQuotaIfNewDay()
    return dailyQuotaUsed
  }

  async function enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const elapsed = now - lastCallTime
    if (elapsed < CALL_DELAY_MS) {
      await delay(CALL_DELAY_MS - elapsed)
    }
    lastCallTime = Date.now()
  }

  async function fetchWithRetry(url: string, body: string): Promise<Response> {
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (response.status === 429) {
        throw new QuotaExhaustedError(
          `Mouser API returned 429. Key: ${maskApiKey(config.apiKey)}`,
        )
      }

      if (response.status >= 500 && attempt < RETRY_DELAYS.length) {
        await delay(RETRY_DELAYS[attempt])
        continue
      }

      return response
    }

    // Should not reach here, but satisfy TypeScript
    throw new Error(
      `Mouser API failed after ${RETRY_DELAYS.length} retries. Key: ${maskApiKey(config.apiKey)}`,
    )
  }

  function matchesBrand(manufacturer: string, canonicalBrand: string): boolean {
    return manufacturer.trim().toLowerCase() === canonicalBrand.toLowerCase()
  }

  function mapToEnrichmentResult(part: MouserPart, mpn: string): EnrichmentResult {
    const result: EnrichmentResult = {
      source: 'mouser' as DataSource,
      mpn,
      brand: part.Manufacturer,
      name: part.Description || undefined,
      description: part.Description || undefined,
      descriptionLanguage: 'en',
      mouserPartNumber: part.MouserPartNumber,
    }

    if (part.DataSheetUrl) {
      result.datasheetUrls = [part.DataSheetUrl]
    }

    if (part.ImagePath) {
      result.imageUrls = [part.ImagePath]
    }

    if (part.LifecycleStatus) {
      result.lifecycle = part.LifecycleStatus
    }

    if (part.Category) {
      result.categoryName = part.Category
    }

    return result
  }

  async function searchByPartNumber(
    mpn: string,
    canonicalBrand: string,
  ): Promise<EnrichmentResult | null> {
    resetQuotaIfNewDay()

    if (isQuotaExhausted()) {
      throw new QuotaExhaustedError()
    }

    await enforceRateLimit()

    const url = `${MOUSER_API_URL}?apiKey=${config.apiKey}`
    const body = JSON.stringify({
      SearchByPartRequest: {
        mouserPartNumber: mpn,
        partSearchOptions: '',
      },
    })

    dailyQuotaUsed++

    const response = await fetchWithRetry(url, body)

    if (!response.ok) {
      throw new Error(
        `Mouser API returned ${response.status}. Key: ${maskApiKey(config.apiKey)}`,
      )
    }

    const data = (await response.json()) as MouserSearchResponse
    const parts = data.SearchResults?.Parts

    if (!parts || parts.length === 0) {
      return null
    }

    const matched = parts.find((part) => matchesBrand(part.Manufacturer, canonicalBrand))

    if (!matched) {
      return null
    }

    return mapToEnrichmentResult(matched, mpn)
  }

  return {
    searchByPartNumber,
    getDailyQuotaUsed,
    isQuotaExhausted,
  }
}
