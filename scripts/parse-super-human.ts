import { chromium } from 'rebrowser-playwright'
import { PlaywrightCrawler, Dataset } from 'crawlee'
import { parseProductPage } from '../src/lib/parser/product-parser'
import { prisma } from '../src/lib/prisma'

// Random delay helper
const randomDelay = (min: number, max: number) =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min))

// Simple human-like scrolling
async function humanScroll(page: any) {
  try {
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
        }, 150)
      })
    })
  } catch (error) {
    // Ignore scroll errors
  }
}

// Check if page is blocked by captcha
function isCaptchaPage(html: string, title: string): boolean {
  const captchaIndicators = [
    'Все нормально, я не робот',
    'Доступ ограничен',
    'Access denied',
    'DDoS-Guard',
    '403 Forbidden',
  ]
  
  return captchaIndicators.some(
    (indicator) => html.includes(indicator) || title.includes(indicator)
  )
}

// User-Agent rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
]

async function main() {
  const args = process.argv.slice(2)
  let categorySlug: string | undefined

  if (args.length > 0) {
    categorySlug = args[0]
    console.log(`📦 Parsing specific category: ${categorySlug}`)
  } else {
    console.log('📦 Parsing all Level 2 categories under "Электронные компоненты"')
  }

  // Get categories to parse
  let categories: Array<{ slug: string; name: string }>

  if (categorySlug) {
    const category = await prisma.category.findFirst({
      where: { slug: categorySlug },
      select: { slug: true, name: true },
    })
    if (!category) {
      console.error(`❌ Category not found: ${categorySlug}`)
      process.exit(1)
    }
    categories = [category]
  } else {
    const rootCategory = await prisma.category.findFirst({
      where: { slug: 'category-1730' },
      select: { id: true },
    })

    if (!rootCategory) {
      console.error('❌ Root category "Электронные компоненты" not found')
      process.exit(1)
    }

    const level1Categories = await prisma.category.findMany({
      where: { parentId: rootCategory.id },
      select: { id: true },
    })

    const level1Ids = level1Categories.map((c) => c.id)

    categories = await prisma.category.findMany({
      where: {
        parentId: { in: level1Ids },
        slug: { not: { startsWith: '/catalog-show/' } },
      },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    })
  }

  console.log(`\n📊 Found ${categories.length} categories to parse\n`)

  const stats = {
    totalCategories: categories.length,
    processedCategories: 0,
    totalProducts: 0,
    successCount: 0,
    failedCount: 0,
    captchaCount: 0,
    startTime: Date.now(),
  }

  // Stage 1: Collect all product URLs from catalogs
  console.log('🔍 Stage 1: Collecting product URLs from catalogs...\n')

  const productUrls: string[] = []

  const catalogCrawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
      useChrome: true,
    },
    browserPoolOptions: {
      useFingerprints: true,
      fingerprintOptions: {
        fingerprintGeneratorOptions: {
          browsers: ['chrome', 'edge'],
          devices: ['desktop'],
          operatingSystems: ['windows', 'macos'],
          locales: ['ru-RU', 'en-US'],
        },
      },
    },
    maxConcurrency: 1,
    maxRequestsPerMinute: 10,
    async requestHandler({ page, request, log }) {
      try {
        await page.waitForSelector('a[href*="/product/"]', { timeout: 10000 })
        await randomDelay(2000, 3000)

        const html = await page.content()
        const title = await page.title()

        if (isCaptchaPage(html, title)) {
          log.warning('🚫 Captcha detected on catalog page - skipping')
          stats.captchaCount++
          return
        }

        const links = await page.$$eval('a[href*="/product/"]', (anchors) =>
          anchors.map((a) => (a as HTMLAnchorElement).href)
        )

        const uniqueLinks = [...new Set(links)]
        productUrls.push(...uniqueLinks)

        log.info(`Found ${uniqueLinks.length} products on this page (total: ${productUrls.length})`)

        const nextButton = await page.$('.pager__next')
        if (nextButton) {
          const nextHref = await nextButton.getAttribute('href')
          if (nextHref) {
            const nextUrl = new URL(nextHref, request.url).href
            await catalogCrawler.addRequests([{ url: nextUrl }])
            log.info('➡️  Next page found, added to queue')
          }
        }
      } catch (error) {
        log.error(`Error collecting catalog: ${error}`)
      }
    },
  })

  for (const category of categories) {
    const catalogUrl = `https://www.chipdip.ru/catalog/${category.slug}`
    await catalogCrawler.addRequests([{ url: catalogUrl }])
  }

  await catalogCrawler.run()

  console.log(`\n✅ Catalog collection complete: ${productUrls.length} products found\n`)
  stats.totalProducts = productUrls.length

  if (productUrls.length === 0) {
    console.log('❌ No products found. Exiting.')
    await prisma.$disconnect()
    return
  }

  // Stage 2: Parse products with human-like behavior
  console.log('🤖 Stage 2: Parsing products with human behavior...\n')

  const productCrawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
      useChrome: true,
    },
    browserPoolOptions: {
      useFingerprints: true,
      fingerprintOptions: {
        fingerprintGeneratorOptions: {
          browsers: ['chrome', 'edge'],
          devices: ['desktop'],
          operatingSystems: ['windows', 'macos'],
          locales: ['ru-RU', 'en-US'],
        },
      },
    },
    preNavigationHooks: [
      async ({ page }) => {
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
        await page.setExtraHTTPHeaders({
          'User-Agent': randomUserAgent,
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        })
      },
    ],
    maxConcurrency: 5,
    maxRequestsPerMinute: 15,
    async requestHandler({ page, request, log }) {
      const productSlug = request.url.split('/product/')[1]?.split('/')[0]?.split('?')[0] || ''

      try {
        await page.waitForLoadState('domcontentloaded')
        await randomDelay(3000, 5000)

        const html = await page.content()
        const title = await page.title()

        if (isCaptchaPage(html, title)) {
          log.warning('🚫 Blocked by captcha - skipping')
          stats.captchaCount++
          stats.failedCount++
          return
        }

        // Simple human behavior: scroll and wait
        await humanScroll(page)
        await randomDelay(5000, 8000)

        // Random long pause (10% chance)
        if (Math.random() < 0.1) {
          log.info('  💤 Random pause 15-25 seconds...')
          await randomDelay(15000, 25000)
        }

        // Parse product
        const parseResult = parseProductPage(html)

        if (!parseResult.success) {
          log.warning(`⚠️  Parse failed: ${parseResult.error}`)
          stats.failedCount++
          return
        }

        const productData = parseResult.data

        if (!productData.manufacturer || !productData.partNumber) {
          log.warning(`⚠️  Missing required fields: ${productSlug}`)
          stats.failedCount++
          return
        }

        const [manufacturerData, categoryData] = await Promise.all([
          prisma.manufacturer.findFirst({
            where: { name: productData.manufacturer },
            select: { slug: true },
          }),
          prisma.category.findFirst({
            where: { name: productData.category },
            select: { slug: true },
          }),
        ])

        const csvData = {
          slug: productSlug,
          name: productData.name,
          partNumber: productData.partNumber || '',
          sku: productData.sku || '',
          manufacturer: productData.manufacturer || '',
          manufacturerSlug: manufacturerData?.slug || '',
          categorySlug: categoryData?.slug || '',
          categoryName: productData.category || '',
          description: productData.description || '',
          weight: productData.weight?.toString() || '',
          specifications: JSON.stringify(productData.specifications || {}),
          datasheets: JSON.stringify(productData.datasheets || []),
          images: JSON.stringify(productData.images || []),
        }

        await Dataset.pushData(csvData)

        stats.successCount++
        const progress = ((stats.successCount + stats.failedCount) / stats.totalProducts) * 100
        const elapsed = (Date.now() - stats.startTime) / 1000 / 60
        const speed = stats.successCount / elapsed

        log.info(
          `✅ ${productData.name} | Progress: ${progress.toFixed(1)}% | Speed: ${speed.toFixed(1)}/min | Captchas: ${stats.captchaCount}`
        )
      } catch (error) {
        log.error(`❌ Error parsing ${productSlug}: ${error}`)
        stats.failedCount++
      }
    },
  })

  await productCrawler.addRequests(productUrls.map((url) => ({ url })))
  await productCrawler.run()

  const totalTime = (Date.now() - stats.startTime) / 1000 / 60
  const avgSpeed = stats.successCount / totalTime

  console.log('\n' + '='.repeat(60))
  console.log('📊 PARSING COMPLETE')
  console.log('='.repeat(60))
  console.log(`✅ Success: ${stats.successCount}`)
  console.log(`❌ Failed: ${stats.failedCount}`)
  console.log(`🚫 Captchas: ${stats.captchaCount}`)
  console.log(`⏱️  Time: ${totalTime.toFixed(1)} minutes`)
  console.log(`⚡ Speed: ${avgSpeed.toFixed(1)} products/min`)
  console.log('='.repeat(60))

  await prisma.$disconnect()
}

main().catch(console.error)
