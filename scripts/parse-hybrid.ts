import 'dotenv/config'
import { chromium } from 'rebrowser-playwright'
import { PlaywrightCrawler, Dataset } from 'crawlee'
import { FingerprintGenerator } from 'fingerprint-generator'
import { parseProductPage } from '../src/lib/parser/product-parser'
import { prisma } from '../src/lib/prisma'
import { TwoCaptchaSolver } from '../src/lib/captcha/2captcha-solver'

// Rebrowser-playwright already has stealth built-in, no need for plugin

// Fingerprint generator
const fingerprintGenerator = new FingerprintGenerator({
  browsers: ['chrome', 'edge'],
  devices: ['desktop'],
  operatingSystems: ['windows', 'macos'],
  locales: ['ru-RU', 'en-US'],
  screen: { minWidth: 1366, maxWidth: 1920 },
  mockWebRTC: true,
})

// 2captcha solver
const captchaSolver = new TwoCaptchaSolver()

// Adaptive strategies
interface Strategy {
  name: string
  maxConcurrency: number
  maxRequestsPerMinute: number
  delayMs: number
}

const strategies: Strategy[] = [
  { name: 'Fast', maxConcurrency: 5, maxRequestsPerMinute: 60, delayMs: 3000 },
  { name: 'Medium', maxConcurrency: 3, maxRequestsPerMinute: 30, delayMs: 5000 },
  { name: 'Slow', maxConcurrency: 1, maxRequestsPerMinute: 10, delayMs: 8000 },
]

let currentStrategyIndex = 0
let captchaCount = 0
let blockCount = 0

// Stats
const stats = {
  totalProducts: 0,
  successCount: 0,
  failedCount: 0,
  captchaSolvedCount: 0,
  startTime: Date.now(),
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const timestamp = new Date().toISOString()
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  }[type]
  console.log(`[${timestamp}] ${emoji} ${message}`)
}

function getCurrentStrategy(): Strategy {
  return strategies[currentStrategyIndex]
}

function downgradeStrategy() {
  if (currentStrategyIndex < strategies.length - 1) {
    currentStrategyIndex++
    const strategy = getCurrentStrategy()
    log(`Downgrading to ${strategy.name} strategy: ${strategy.maxConcurrency} browsers, ${strategy.maxRequestsPerMinute} req/min`, 'warning')
    return true
  }
  return false
}

async function detectYandexCaptcha(page: any): Promise<string | null> {
  try {
    // Check for Yandex SmartCaptcha container
    const captchaContainer = await page.$('#captcha-container')
    if (!captchaContainer) return null

    // Extract sitekey from script or data attribute
    const sitekey = await page.evaluate(() => {
      const container = document.querySelector('#captcha-container')
      if (!container) return null
      
      // Try data-sitekey attribute
      const dataKey = container.getAttribute('data-sitekey')
      if (dataKey) return dataKey

      // Try to find in scripts
      const scripts = Array.from(document.querySelectorAll('script'))
      for (const script of scripts) {
        const match = script.textContent?.match(/sitekey['":\s]+([a-zA-Z0-9_-]+)/)
        if (match) return match[1]
      }
      
      return null
    })

    return sitekey
  } catch (error) {
    return null
  }
}

async function solveYandexCaptcha(page: any, url: string): Promise<boolean> {
  try {
    log('🔐 Yandex SmartCaptcha detected! Attempting to solve...', 'warning')
    
    const sitekey = await detectYandexCaptcha(page)
    if (!sitekey) {
      log('⚠️ Could not extract Yandex SmartCaptcha sitekey', 'warning')
      return false
    }

    log(`📝 Sitekey: ${sitekey}`)
    
    // Solve captcha with 2captcha
    const result = await captchaSolver.solveYandexSmartCaptcha(sitekey, url)
    
    if (!result.success) {
      log(`❌ Failed to solve captcha: ${result.error}`, 'error')
      return false
    }

    log('✅ Captcha solved! Submitting token to server...', 'success')
    
    // Find and submit the captcha form with token
    const submitted = await page.evaluate((token: string) => {
      // Find the captcha form (action="/forms/captcha2")
      const form = document.querySelector('form[action="/forms/captcha2"]') as HTMLFormElement
      if (!form) return false
      
      // Find existing smart-token input and fill it
      const tokenInput = form.querySelector('input[name="smart-token"]') as HTMLInputElement
      if (!tokenInput) return false
      
      tokenInput.value = token
      
      // Submit form
      form.submit()
      return true
    }, result.token!)
    
    if (!submitted) {
      log('⚠️ Could not find form to submit token', 'warning')
      return false
    }
    
    // Wait for navigation after form submit
    try {
      await page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' })
    } catch (error) {
      log('⚠️ Navigation timeout after form submit', 'warning')
    }
    
    await page.waitForTimeout(2000)
    
    // Check if captcha bypassed
    const stillCaptcha = await isCaptchaPage(page)
    if (stillCaptcha) {
      log('⚠️ Still showing captcha after token submit', 'warning')
      return false
    }
    
    stats.captchaSolvedCount++
    captchaCount++
    
    log(`✅ Captcha bypassed successfully! Total solved: ${stats.captchaSolvedCount}`, 'success')
    return true
  } catch (error) {
    log(`❌ Error solving captcha: ${error}`, 'error')
    return false
  }
}

async function isCaptchaPage(page: any): Promise<boolean> {
  try {
    const title = await page.title()
    const url = page.url()
    
    // Check for captcha indicators
    if (
      title.includes('Все нормально, я не робот') ||
      title.includes('Доступ ограничен') ||
      title.includes('403') ||
      url.includes('/forms/captcha')
    ) {
      return true
    }

    // Check for Yandex SmartCaptcha
    const hasCaptcha = await page.$('#captcha-container')
    return !!hasCaptcha
  } catch {
    return false
  }
}

async function randomDelay(min: number, max: number) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  await new Promise(resolve => setTimeout(resolve, delay))
}

async function humanScroll(page: any) {
  try {
    await page.evaluate(() => {
      const scrollHeight = document.body.scrollHeight
      const viewportHeight = window.innerHeight
      const scrollSteps = 5
      const stepSize = (scrollHeight - viewportHeight) / scrollSteps

      let currentScroll = 0
      const interval = setInterval(() => {
        currentScroll += stepSize
        window.scrollTo(0, currentScroll)
        
        if (currentScroll >= scrollHeight - viewportHeight) {
          clearInterval(interval)
        }
      }, 100)
    })
    
    await page.waitForTimeout(500)
  } catch (error) {
    // Ignore scroll errors
  }
}

async function main() {
  const categorySlug = process.argv[2]
  
  if (!categorySlug) {
    console.error('Usage: npx tsx scripts/parse-hybrid.ts <category-slug>')
    process.exit(1)
  }

  log(`Starting hybrid parser for category: ${categorySlug}`, 'info')
  log(`Initial strategy: ${getCurrentStrategy().name}`, 'info')

  // Get category from database
  const category = await prisma.category.findFirst({
    where: { slug: categorySlug },
  })

  if (!category) {
    log(`Category not found: ${categorySlug}`, 'error')
    process.exit(1)
  }

  const catalogUrl = `https://www.chipdip.ru/catalog/${category.slug}`
  log(`Catalog URL: ${catalogUrl}`, 'info')

  // Stage 1: Collect product URLs
  const productUrls: string[] = []
  
  log('📋 Stage 1: Collecting product URLs from catalog...', 'info')
  
  const catalogCrawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
    },
    maxConcurrency: 1,
    maxRequestsPerMinute: 10,
    async requestHandler({ page, request, log: crawleeLog }) {
      // Set viewport
      await page.setViewportSize({ width: 1920, height: 1080 })

      crawleeLog.info(`Fetching catalog page: ${request.url}`)
      
      await page.waitForSelector('a[href*="/product/"]', { timeout: 10000 })
      await page.waitForTimeout(2000)

      // Extract product links
      const links = await page.$$eval('a[href*="/product/"]', (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href)
      )

      const uniqueLinks = [...new Set(links)]
      productUrls.push(...uniqueLinks)
      
      crawleeLog.info(`Found ${uniqueLinks.length} products on this page. Total: ${productUrls.length}`)

      // Check for next page
      const nextButton = await page.$('.pager__next')
      if (nextButton) {
        const nextHref = await nextButton.getAttribute('href')
        if (nextHref) {
          const nextUrl = new URL(nextHref, request.url).href
          crawleeLog.info(`Next page found: ${nextUrl}`)
          await catalogCrawler.addRequests([nextUrl])
        }
      }
    },
  })

  await catalogCrawler.run([catalogUrl])
  
  log(`✅ Collected ${productUrls.length} product URLs`, 'success')
  stats.totalProducts = productUrls.length

  // Stage 2: Parse products with adaptive strategy
  log('🔍 Stage 2: Parsing products with adaptive strategy...', 'info')

  const productCrawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
    },
    maxConcurrency: getCurrentStrategy().maxConcurrency,
    maxRequestsPerMinute: getCurrentStrategy().maxRequestsPerMinute,
    async requestHandler({ page, request, log: crawleeLog }) {
      try {
        // Set viewport
        await page.setViewportSize({ width: 1920, height: 1080 })

        crawleeLog.info(`Parsing product: ${request.url}`)

        // Check for captcha
        if (await isCaptchaPage(page)) {
          log('🚫 Captcha detected!', 'warning')
          
          // Try to solve captcha
          const solved = await solveYandexCaptcha(page, request.url)
          
          if (solved) {
            log('✅ Captcha solved, continuing...', 'success')
            // Reload page after solving
            await page.reload()
            await page.waitForTimeout(2000)
          } else {
            log('❌ Failed to solve captcha', 'error')
            blockCount++
            
            // Downgrade strategy after 3 failed captchas
            if (captchaCount >= 3) {
              if (downgradeStrategy()) {
                captchaCount = 0
                // Note: Crawler settings will apply on next request
              } else {
                log('⏸️ All strategies exhausted. Pausing for 10 minutes...', 'warning')
                await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000))
                captchaCount = 0
              }
            }
            
            stats.failedCount++
            return
          }
        }

        // Human-like behavior
        await humanScroll(page)
        await randomDelay(getCurrentStrategy().delayMs, getCurrentStrategy().delayMs + 2000)

        // Get HTML
        const html = await page.content()

        // Extract slug from URL
        const productSlug = request.url.split('/product/')[1]?.split('/')[0]?.split('?')[0] || ''

        // Parse product
        const parseResult = parseProductPage(html)
        
        if (!parseResult.success) {
          crawleeLog.warning(`Parse failed: ${parseResult.error}`)
          stats.failedCount++
          return
        }

        const productData = parseResult.data

        // Get manufacturer and category slugs from database
        const manufacturer = await prisma.manufacturer.findFirst({
          where: { name: productData.manufacturer },
          select: { slug: true },
        })

        const categoryData = await prisma.category.findFirst({
          where: { name: productData.category },
          select: { slug: true },
        })

        // Save to dataset
        await Dataset.pushData({
          slug: productSlug,
          name: productData.name,
          partNumber: productData.partNumber,
          sku: productData.sku,
          manufacturer: productData.manufacturer,
          manufacturerSlug: manufacturer?.slug || '',
          categorySlug: categoryData?.slug || category.slug,
          categoryName: productData.category,
          description: productData.description,
          weight: productData.weight?.toString() || '',
          specifications: JSON.stringify(productData.specifications),
          datasheets: JSON.stringify(productData.datasheets),
          images: JSON.stringify(productData.images),
        })

        stats.successCount++
        
        const progress = ((stats.successCount + stats.failedCount) / stats.totalProducts * 100).toFixed(1)
        const elapsed = Math.floor((Date.now() - stats.startTime) / 1000)
        const speed = (stats.successCount / (elapsed / 60)).toFixed(1)
        
        crawleeLog.info(`✅ Progress: ${stats.successCount}/${stats.totalProducts} (${progress}%) | Speed: ${speed} products/min | Strategy: ${getCurrentStrategy().name}`)
      } catch (error) {
        crawleeLog.error(`Error parsing product: ${error}`)
        stats.failedCount++
      }
    },
  })

  await productCrawler.run(productUrls)

  // Final stats
  const elapsed = Math.floor((Date.now() - stats.startTime) / 1000)
  const speed = (stats.successCount / (elapsed / 60)).toFixed(1)
  
  log('', 'info')
  log('=== Parsing Complete ===', 'success')
  log(`Total: ${stats.totalProducts}`, 'info')
  log(`Success: ${stats.successCount}`, 'success')
  log(`Failed: ${stats.failedCount}`, 'error')
  log(`Captchas solved: ${stats.captchaSolvedCount}`, 'info')
  log(`Time: ${Math.floor(elapsed / 60)} min ${elapsed % 60} sec`, 'info')
  log(`Speed: ${speed} products/min`, 'info')
  log(`Final strategy: ${getCurrentStrategy().name}`, 'info')
  
  await prisma.$disconnect()
}

main().catch(console.error)
