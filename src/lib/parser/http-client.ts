/**
 * HTTP Client Module
 * 
 * Provides HTTP client with retry logic, timeout, and rate limiting.
 * Uses dependency injection pattern for testability.
 * 
 * Features:
 * - Retry logic with exponential backoff (3 retries max)
 * - Timeout configuration (10 seconds default)
 * - User-Agent header
 * - Rate limiting integration
 * - Comprehensive error handling
 */

import { type RateLimiter } from './rate-limiter'

export interface HttpClientConfig {
  timeout: number
  maxRetries: number
  backoffMs: number
  userAgent: string
}

export interface HttpClientDependencies {
  rateLimiter: RateLimiter
  fetch: typeof globalThis.fetch
}

export interface HttpClient {
  get: (url: string) => Promise<string>
}

export interface FetchOptions {
  retries: number
  backoff: number
}

/**
 * Default HTTP client configuration
 */
export const DEFAULT_HTTP_CONFIG: HttpClientConfig = {
  timeout: 10000, // 10 seconds
  maxRetries: 3,
  backoffMs: 1000, // 1 second initial backoff
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

/**
 * Creates HTTP client with dependency injection
 * 
 * @param config - HTTP client configuration
 * @param deps - Dependencies (rateLimiter, fetch)
 * @returns HttpClient instance
 */
export function createHttpClient(
  config: HttpClientConfig,
  deps: HttpClientDependencies
): HttpClient {
  const { rateLimiter, fetch } = deps

  /**
   * Fetches URL with retry logic and exponential backoff
   * 
   * @param url - URL to fetch
   * @param options - Fetch options with retry count and backoff
   * @returns Response text
   * @throws Error if all retries fail or timeout occurs
   */
  async function fetchWithRetry(
    url: string,
    options: FetchOptions
  ): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} for URL ${url}`
        )
      }

      return await response.text()
    } catch (error) {
      clearTimeout(timeoutId)

      // Check if it's an abort error (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Request timeout after ${config.timeout}ms for URL ${url}`
        )
      }

      // Retry logic
      if (options.retries < config.maxRetries) {
        const delay = options.backoff * Math.pow(2, options.retries)
        console.warn(
          `Retry ${options.retries + 1}/${config.maxRetries} after ${delay}ms for ${url}`
        )

        await new Promise(resolve => setTimeout(resolve, delay))

        return fetchWithRetry(url, {
          retries: options.retries + 1,
          backoff: options.backoff,
        })
      }

      // All retries exhausted
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new Error(
        `Failed to fetch ${url} after ${config.maxRetries} retries: ${errorMessage}`
      )
    }
  }

  /**
   * Performs GET request with rate limiting
   * 
   * @param url - URL to fetch
   * @returns Response HTML as string
   * @throws Error if request fails after all retries
   */
  async function get(url: string): Promise<string> {
    return rateLimiter.execute(async () => {
      return fetchWithRetry(url, {
        retries: 0,
        backoff: config.backoffMs,
      })
    })
  }

  return {
    get,
  }
}
