import { chromium } from 'rebrowser-playwright'
import { PlaywrightCrawler, Dataset } from 'crawlee'
import { newInjectedContext } from 'fingerprint-injector'
import { FingerprintGenerator } from 'fingerprint-generator'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { parseProductPage } from '../src/lib/parser/product-parser'
import { prisma } from '../src/lib/prisma'
import { captchaSolver } from '../src/lib/captcha/2captcha-solver'

// Fingerprint generator with realistic constraints
const fingerprintGenerator = new FingerprintGenerator({
  browsers: ['chrome', 'edge'],
  devices: ['desktop'],
  operatingSystems: ['windows', 'macos'],
  locales: ['ru-RU', 'en-US'],
  screen: {
    minWidth: 1366,
    maxWidth: 1920,
    minHeight: 768,
    maxHeight: 1080,
  },
  mockWebRTC: true,
  slim: false,
})

// Random delay helper
const randomDelay = (min: number, max: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min))

// Human-like scrolling
async function humanScroll(page: any) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0
      const distance = 100
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance

        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })
}

// Check if page is blocked by captcha
function isCaptchaPage(title: string, url: string): boolean {
  const captchaIndicators = [
    'Все нормально, я не робот',
    'Доступ ограничен',
    'Access denied',
    'Captcha',
    '403',
    'Forbidden',
  ]
  return captchaIndicators.some((indicator) => title.includes(indicator))
}

// Detect captcha type and extract sitekey
async function detectCaptcha(page: any): Promise<{ type: string; sitekey: string } | null> {
  try {
    // Check for hCaptcha
    const hcaptcha = await page.$('iframe[src*="hcaptcha.com"]')
    if (hcaptcha) {
      const sitekey = await page.$eval('[data-sitekey]', (el: any) => el.getAttribute('data-sitekey'))
      if (sitekey) {
        return { type: 'hcaptcha', sitekey }
      }
    }

    // Check for reCaptcha
    const recaptcha = await page.$('iframe[src*="recaptcha"]')
    if (recaptcha) {
      const sitekey = await page.$eval('[data-sitekey]', (el: any) => el.getAttribute('data-sitekey'))
      if (sitekey) {
        return { type: 'recaptcha', sitekey }
      }
    }

    // Check for Cloudflare Turnstile
    const turnstile = await page.$('iframe[src*="challenges.cloudflare.com"]')
    if (turnstile) {
      const sitekey = await page.$eval('[data-sitekey]', (el: any) => el.getAttribute('data-sitekey'))
      if (sitekey) {
        return { type: 'turnstile', sitekey }
      }
    }

    return null
  } catch (error) {
    return null
  }
}

// Solve captcha with 2captcha
async function solveCaptchaAndContinue(page: any, url: string): Promise<boolean> {
  console.log('🔐 Captcha detected! Attempting to solve with 2captcha...')

  const captchaInfo = await detectCaptcha(page)
  
  if (!captchaInfo) {
    console.log('⚠️ Could not detect captcha type or sitekey')
    return false
  }

  console.log(`🔍 Detected ${captchaInfo.type} with sitekey: ${captchaInfo.sitekey}`)

  let result
  if (captchaInfo.type === 'hcaptcha') {
    result = await captchaSolver.solveHCaptcha(captchaInfo.sitekey, url)
  } else if (captchaInfo.type === 'recaptcha') {
    result = await captchaSolver.solveReCaptchaV2(captchaInfo.sitekey, url)
  } else if (captchaInfo.type === 'turnstile') {
    result = await captchaSolver.solveTurnstile(captchaInfo.sitekey, url)
  } else {
    console.log('❌ Unsupported captcha type')
    return false
  }

  if (!result.success || !result.token) {
    console.log(`❌ Failed to solve captcha: ${result.error}`)
    return false
  }

  console.log('✅ Captcha solved! Applying token...')

  // Apply captcha token to page
  try {
    if (captchaInfo.type === 'hcaptcha') {
      await page.evaluate((token: string) => {
        const textarea = document.querySelector('[name="h-captcha-response"]') as HTMLTextAreaElement
        if (textarea) textarea.value = token
      }, result.token)
    } else if (captchaInfo.type === 'recaptcha') {
      await page.evaluate((token: string) => {
        const textarea = document.querySelector('[name="g-recaptcha-response"]') as HTMLTextAreaElement
        if (textarea) textarea.value = token
      }, result.token)
    } else if (captchaInfo.type === 'turnstile') {
      await page.evaluate((token: string) => {
        const input = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement
        if (input) input.value = token
      }, result.token)
    }

    // Submit form or reload page
    await page.evaluate(() => {
      const form = document.querySelector('form')
      if (form) {
        form.submit()
      } else {
        window.location.reload()
      }
    })

    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await randomDelay(2000, 3000)

    console.log('✅ Captcha token applied successfully!')
    return true
  } catch (error) {
    console.log('❌ Failed to apply captcha token:', error)
    return false
  }
}

async function main() {
  const categorySlug = process.argv[2]

  if (!categorySlug) {
    console.error('Usage: npx tsx scripts/parse-with-2captcha.ts <category-slug>')
    process.exit(1)
  }

  console.log(`🚀 Starting parser with 2captcha for category: ${categorySlug}`)

  // Check 2captcha balance
  const balance = await captchaSolver.getBalance()
  console.log(`💰 2captcha balance: $${balance.toFixed(2)}`)

  if (balance < 0.5) {
    console.error('❌ Insufficient balance! Please top up your 2captcha account.')
    process.exit(1)
  }

  // Get category from database
  const category = await prisma.category.findFirst({
    where: { slug: categorySlug },
  })

  if (!category) {
    console.error(`❌ Category not found: ${categorySlug}`)
    process.exit(1)
  }

  const catalogUrl = `https://www.chipdip.ru/catalog/${categorySlug}`
  console.log(`📂 Catalog URL: ${catalogUrl}`)

  let totalProducts = 0
  let successCount = 0
  let failCount = 0
  let captchaSolvedCount = 0
  const startTime = Date.now()

  // Stage 1: Collect product URLs from catalog
  const productUrls: string[] = []

  const catalogCrawler = new PlaywrightCrawler({
    maxConcurrency: 1,
    maxRequestsPerMinute: 10,
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
    },
    preNavigationHooks: [
      async ({ page }) => {
        const { fingerprint, headers } = fingerprintGenerator.getFingerprint()
        await page.setExtraHTTPHeaders(headers)
        await page.setViewportSize({
          width: fingerprint.screen.width,
          height: fingerprint.screen.height,
        })
      },
    ],
    async requestHandler({ page, request, log }) {
      const title = await page.title()

      // Check for captcha
      if (isCaptchaPage(title, request.url)) {
        log.warning('🚫 Captcha detected on catalog page')
        const solved = await solveCaptchaAndContinue(page, request.url)
        if (solved) {
          captchaSolvedCount++
          log.info('✅ Captcha solved, continuing...')
        } else {
          log.error('❌ Failed to solve captcha')
          return
        }
      }

      // Wait for products to load
      await page.waitForSelector('a[href*="/product/"]', { timeout: 10000 }).catch(() => {})
      await randomDelay(2000, 3000)

      // Extract product links
      const links = await page.$$eval('a[href*="/product/"]', (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href)
      )

      const uniqueLinks = [...new Set(links)]
      productUrls.push(...uniqueLinks)
      log.info(`Found ${uniqueLinks.length} products on this page (total: ${productUrls.length})`)

      // Check for next page
      const nextButton = await page.$('.pager__next')
      if (nextButton) {
        const nextHref = await nextButton.getAttribute('href')
        if (nextHref) {
          const nextUrl = new URL(nextHref, request.url).href
          log.info(`Next page found: ${nextUrl}`)
          await catalogCrawler.addRequests([nextUrl])
        }
      }
    },
  })

  // Start catalog crawling
  await catalogCrawler.run([catalogUrl])

  console.log(`\n✅ Catalog collection complete: ${productUrls.length} products found\n`)

  if (productUrls.length === 0) {
    console.log('❌ No products found in catalog')
    return
  }

  totalProducts = productUrls.length

  // Stage 2: Parse products with 2captcha support
  const productCrawler = new PlaywrightCrawler({
    maxConcurrency: 5, // 5 browsers in parallel
    maxRequestsPerMinute: 60, // 1 req/sec
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
    },
    preNavigationHooks: [
      async ({ page }) => {
        const { fingerprint, headers } = fingerprintGenerator.getFingerprint()
        await page.setExtraHTTPHeaders(headers)
        await page.setViewportSize({
          width: fingerprint.screen.width,
          height: fingerprint.screen.height,
        })
      },
    ],
    async requestHandler({ page, request, log }) {
      const title = await page.title()

      // Check for captcha
      if (isCaptchaPage(title, request.url)) {
        log.warning('🚫 Captcha detected on product page')
        const solved = await solveCaptchaAndContinue(page, request.url)
        if (solved) {
          captchaSolvedCount++
          log.info('✅ Captcha solved, continuing...')
        } else {
          log.error('❌ Failed to solve captcha')
          failCount++
          return
        }
      }

      // Human-like behavior
      await humanScroll(page)
      await randomDelay(2000, 4000)

      // Get page HTML
      const html = await page.content()

      // Extract slug from URL
      const productSlug = request.url.split('/product/')[1]?.split('/')[0]?.split('?')[0] || ''

      // Parse product
      const result = parseProductPage(html)

      if (result.success && result.data) {
        const productData = result.data

        // Fetch manufacturer and category slugs from database
        const manufacturer = await prisma.manufacturer.findFirst({
          where: { name: productData.manufacturer },
          select: { slug: true },
        })

        const category = await prisma.category.findFirst({
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
          categorySlug: category?.slug || '',
          categoryName: productData.category,
          description: productData.description,
          weight: productData.weight,
          specifications: JSON.stringify(productData.specifications),
          datasheets: JSON.stringify(productData.datasheets),
          images: JSON.stringify(productData.images),
        })

        successCount++
        log.info(`✅ Parsed: ${productData.name}`)
      } else {
        failCount++
        log.error(`❌ Failed to parse: ${request.url}`)
      }

      // Progress stats
      const processed = successCount + failCount
      const progress = ((processed / totalProducts) * 100).toFixed(1)
      const elapsed = (Date.now() - startTime) / 1000
      const speed = (successCount / elapsed) * 60
      const remaining = totalProducts - processed
      const eta = remaining / (successCount / elapsed)

      console.log(
        `📊 Progress: ${processed}/${totalProducts} (${progress}%) | ✅ ${successCount} | ❌ ${failCount} | 🔐 ${captchaSolvedCount} captchas | ⚡ ${speed.toFixed(1)}/min | ⏱️ ETA: ${Math.round(eta / 60)}min`
      )
    },
  })

  // Start product parsing
  await productCrawler.run(productUrls)

  // Export to CSV
  const timestamp = new Date().toISOString().split('T')[0]
  await Dataset.exportToCSV(`2captcha-${timestamp}`)

  // Final balance check
  const finalBalance = await captchaSolver.getBalance()
  const spent = balance - finalBalance

  console.log('\n============================================================')
  console.log('🎉 Parsing with 2captcha completed!')
  console.log('📊 Stats:')
  console.log(`  Total products: ${totalProducts}`)
  console.log(`  Successfully parsed: ${successCount}`)
  console.log(`  Failed: ${failCount}`)
  console.log(`  Captchas solved: ${captchaSolvedCount}`)
  console.log(`  Success rate: ${((successCount / totalProducts) * 100).toFixed(1)}%`)
  console.log(`  Duration: ${Math.round((Date.now() - startTime) / 1000)}s`)
  console.log(`  Speed: ${((successCount / ((Date.now() - startTime) / 1000)) * 60).toFixed(1)} products/min`)
  console.log(`  2captcha spent: $${spent.toFixed(2)}`)
  console.log(`  2captcha balance: $${finalBalance.toFixed(2)}`)
  console.log('============================================================\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
