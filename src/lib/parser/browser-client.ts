/**
 * Browser Client Module
 * 
 * Provides headless browser functionality for scraping JavaScript-rendered pages.
 * Uses Playwright to handle dynamic content that requires JavaScript execution.
 * 
 * Features:
 * - Launch headless browser with stealth techniques
 * - Navigate to pages and wait for content to load
 * - Extract HTML after JavaScript execution
 * - Handle timeouts and errors gracefully
 * - Resource optimization (block images, fonts, etc.)
 * - Anti-detection: disable automation flags, randomize fingerprints
 */

import { chromium, type Browser, type Page } from 'playwright'

export interface BrowserClientConfig {
  headless?: boolean
  timeout?: number
  blockResources?: boolean
  userAgent?: string
}

export interface BrowserClient {
  fetchPage(url: string): Promise<string>
  close(): Promise<void>
}

// Randomize user agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
]

const DEFAULT_CONFIG: Required<BrowserClientConfig> = {
  headless: true,
  timeout: 30000,
  blockResources: true,
  userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
}

/**
 * Creates a browser client for scraping JavaScript-rendered pages
 * 
 * @param config - Browser configuration options
 * @returns Browser client with fetchPage and close methods
 */
export async function createBrowserClient(
  config: BrowserClientConfig = {}
): Promise<BrowserClient> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  let browser: Browser | null = null
  let page: Page | null = null

  /**
   * Fetches page HTML after JavaScript execution
   */
  async function fetchPage(url: string): Promise<string> {
    try {
      // Launch browser if not already running
      if (!browser) {
        browser = await chromium.launch({
          headless: finalConfig.headless,
          args: [
            '--disable-blink-features=AutomationControlled', // Hide automation
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        })
      }

      // Create new page if needed
      if (!page) {
        // Randomize viewport to avoid fingerprinting
        const viewports = [
          { width: 1920, height: 1080 },
          { width: 1366, height: 768 },
          { width: 1536, height: 864 },
          { width: 1440, height: 900 },
        ]
        const viewport = viewports[Math.floor(Math.random() * viewports.length)]

        page = await browser.newPage({
          userAgent: finalConfig.userAgent,
          viewport,
          locale: 'ru-RU',
          timezoneId: 'Europe/Moscow',
        })

        // Stealth techniques: hide webdriver flag (minimal approach)
        await page.addInitScript(() => {
          // Remove webdriver flag - most important for bot detection
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          })

          // Mock chrome object
          // @ts-ignore
          if (!window.chrome) {
            // @ts-ignore
            window.chrome = { runtime: {} }
          }
        })

        // Block unnecessary resources to speed up loading
        if (finalConfig.blockResources) {
          await page.route('**/*', (route) => {
            const resourceType = route.request().resourceType()
            if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
              route.abort()
            } else {
              route.continue()
            }
          })
        }
      }

      // Navigate to page and wait for content
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: finalConfig.timeout,
      })

      // Wait additional time for AJAX requests to complete
      await page.waitForTimeout(3000)

      // Wait for product links to appear (ChipDip specific)
      // Try multiple selectors as ChipDip structure may vary
      const selectors = [
        'a[href*="/product/"]',
        '.catalog__item a',
        '.product_simple a',
        'a.product__name',
      ]

      let selectorFound = false
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, {
            timeout: 5000,
            state: 'attached',
          })
          selectorFound = true
          console.log(`Found products using selector: ${selector}`)
          break
        } catch {
          // Try next selector
        }
      }

      if (!selectorFound) {
        console.warn('No product selectors found, page might not have products')
      }

      // Get full HTML after JavaScript execution
      const html = await page.content()
      
      return html
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to fetch page ${url}: ${errorMessage}`)
    }
  }

  /**
   * Closes browser and cleans up resources
   */
  async function close(): Promise<void> {
    try {
      if (page) {
        await page.close()
        page = null
      }
      if (browser) {
        await browser.close()
        browser = null
      }
    } catch (error) {
      console.warn('Error closing browser:', error)
    }
  }

  return {
    fetchPage,
    close,
  }
}

/**
 * Utility function to fetch a single page with browser and auto-close
 * 
 * @param url - URL to fetch
 * @param config - Browser configuration
 * @returns Page HTML content
 */
export async function fetchPageWithBrowser(
  url: string,
  config: BrowserClientConfig = {}
): Promise<string> {
  const client = await createBrowserClient(config)
  try {
    return await client.fetchPage(url)
  } finally {
    await client.close()
  }
}
