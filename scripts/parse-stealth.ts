/**
 * Fast Stealth ChipDip Parser
 * 
 * Features:
 * - 10 parallel browsers for speed
 * - Stealth plugin (17 evasion techniques)
 * - Random delays 3-4 seconds between requests
 * - Batch processing: 200 products → 5 min pause
 * - Human-like behavior: scrolling, mouse movements
 * - User-Agent rotation
 * - Speed: ~100-120 products/hour
 * - For 2M products: ~17-20 days
 */

import 'dotenv/config'
import { PlaywrightCrawler, Dataset } from 'crawlee'
import { PrismaClient } from '@prisma/client'
import { parseProductPage } from '../src/lib/parser/product-parser.js'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// Enable stealth mode to avoid bot detection
chromium.use(StealthPlugin())

const prisma = new PrismaClient()

// Random User-Agents for rotation
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
]

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

// Random delay between min and max milliseconds
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Human-like page scrolling
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

// Statistics
const stats = {
  totalProducts: 0,
  parsedProducts: 0,
  failedProducts: 0,
  startTime: Date.now(),
  batchCount: 0,
  pauseTime: 0,
}

function logProgress() {
  const elapsed = (Date.now() - stats.startTime - stats.pauseTime) / 1000 / 60 // minutes
  const speed = elapsed > 0 ? stats.parsedProducts / elapsed : 0
  const progress = stats.totalProducts > 0 ? (stats.parsedProducts / stats.totalProducts * 100).toFixed(1) : '0.0'
  const eta = stats.totalProducts > 0 && speed > 0 
    ? ((stats.totalProducts - stats.parsedProducts) / speed).toFixed(0)
    : '?'
  
  console.log(`📊 Progress: ${stats.parsedProducts}/${stats.totalProducts} (${progress}%) | Speed: ${speed.toFixed(1)} products/min | ETA: ${eta} min | Failed: ${stats.failedProducts}`)
}

/**
 * Main crawler function
 */
async function main() {
  const args = process.argv.slice(2)
  const categorySlugs = args.length > 0 ? args : []
  
  console.log('🚀 Starting Fast Stealth Parser...')
  console.log(`📦 Categories: ${categorySlugs.length > 0 ? categorySlugs.join(', ') : 'ALL'}`)
  console.log('⚙️  Settings: 10 browsers, 120 req/min, 3-4 sec delays, batch 200 → pause 5 min\n')
  
  // Get categories from database
  let categories
  if (categorySlugs.length > 0) {
    categories = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { id: true, name: true, slug: true },
    })
  } else {
    // Get all Level 2 categories under "Электронные компоненты"
    const rootCategory = await prisma.category.findFirst({
      where: { slug: 'category-1730' },
      select: { id: true },
    })
    
    if (!rootCategory) {
      console.error('❌ Root category not found')
      process.exit(1)
    }
    
    const level1Categories = await prisma.category.findMany({
      where: { parentId: rootCategory.id },
      select: { id: true },
    })
    
    const level1Ids = level1Categories.map(c => c.id)
    
    categories = await prisma.category.findMany({
      where: { 
        parentId: { in: level1Ids },
        slug: { not: { startsWith: '/catalog-show/' } }
      },
      select: { id: true, name: true, slug: true },
    })
  }
  
  console.log(`📂 Found ${categories.length} categories to parse\n`)
  
  // Collect all product URLs first
  const productUrls: string[] = []
  
  for (const category of categories) {
    console.log(`\n[${categories.indexOf(category) + 1}/${categories.length}] Processing: ${category.name}`)
    
    const catalogUrl = `https://www.chipdip.ru/catalog/${category.slug}`
    
    // Fetch catalog page to get product links with pagination
    const catalogCrawler = new PlaywrightCrawler({
      launchContext: {
        launcher: chromium,
        launchOptions: {
          headless: true,
        },
      },
      maxConcurrency: 1,
      maxRequestsPerMinute: 30,
      preNavigationHooks: [
        async ({ page }) => {
          await page.setExtraHTTPHeaders({
            'User-Agent': getRandomUserAgent(),
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          })
        },
      ],
      async requestHandler({ request, page, log }) {
        log.info(`Fetching catalog: ${request.url}`)
        
        // Wait for products to load
        await page.waitForSelector('a[href*="/product/"]', { timeout: 10000 })
        await page.waitForTimeout(2000) // Extra wait for all products
        
        // Human-like scrolling
        await humanScroll(page)
        
        // Extract product links
        const links = await page.$$eval('a[href*="/product/"]', (elements) =>
          elements.map((el) => (el as HTMLAnchorElement).href)
        )
        
        const uniqueLinks = [...new Set(links)]
        productUrls.push(...uniqueLinks)
        
        log.info(`Found ${uniqueLinks.length} products on this page`)
        
        // Check for next page
        const pagerElement = await page.$('.pager')
        if (pagerElement) {
          log.info('Pager element exists')
          const nextPageLink = await page.$('.pager__next')
          if (nextPageLink) {
            const nextPageUrl = await nextPageLink.getAttribute('href')
            if (nextPageUrl) {
              const fullUrl = new URL(nextPageUrl, request.url).href
              log.info(`Found next page: ${fullUrl}`)
              await catalogCrawler.addRequests([fullUrl])
            }
          }
        }
      },
    })
    
    await catalogCrawler.run([catalogUrl])
    console.log(`✅ Collected ${productUrls.length} product URLs so far`)
  }
  
  console.log(`\n✅ Total product URLs collected: ${productUrls.length}`)
  console.log(`🚀 Starting product parsing with 10 parallel browsers...\n`)
  
  stats.totalProducts = productUrls.length
  
  // Parse products with parallel browsers
  const productCrawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
    },
    maxConcurrency: 10, // 10 parallel browsers
    maxRequestsPerMinute: 120, // 2 req/sec
    maxRequestRetries: 3,
    
    preNavigationHooks: [
      async ({ page }) => {
        await page.setExtraHTTPHeaders({
          'User-Agent': getRandomUserAgent(),
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        })
      },
    ],
    
    async requestHandler({ request, page, log }) {
      // Random delay 3-4 seconds before each request
      await randomDelay(3000, 4000)
      
      log.info(`Parsing: ${request.url}`)
      
      // Human-like scrolling
      await humanScroll(page)
      
      // Random delay after scrolling
      await randomDelay(500, 1500)
      
      const html = await page.content()
      
      // Check for captcha
      const title = await page.title()
      if (title.includes('Все нормально, я не робот') || 
          title.includes('Доступ ограничен') ||
          title.includes('403')) {
        log.error('🚫 Blocked by ChipDip captcha')
        stats.failedProducts++
        return
      }
      
      // Extract slug from URL
      const productSlug = request.url.split('/product/')[1]?.split('/')[0]?.split('?')[0] || ''
      
      // Parse product
      const result = await parseProductPage(html)
      
      if (result.success && result.data) {
        const productData = result.data
        
        // Fetch manufacturer and category slugs from database
        const manufacturer = productData.manufacturer
          ? await prisma.manufacturer.findFirst({
              where: { name: productData.manufacturer },
              select: { slug: true },
            })
          : null
        
        const category = productData.category
          ? await prisma.category.findFirst({
              where: { name: productData.category },
              select: { slug: true },
            })
          : null
        
        // Prepare CSV data
        const csvData = {
          slug: productSlug,
          name: productData.name,
          partNumber: productData.partNumber,
          sku: productData.sku || '',
          manufacturer: productData.manufacturer || '',
          manufacturerSlug: manufacturer?.slug || '',
          categorySlug: category?.slug || '',
          categoryName: productData.category || '',
          description: productData.description || '',
          weight: productData.weight || '',
          specifications: JSON.stringify(productData.specifications || []),
          datasheets: JSON.stringify(productData.datasheets?.map(d => d.url) || []),
          images: JSON.stringify(productData.images?.map(img => img.url) || []),
        }
        
        await Dataset.pushData(csvData)
        stats.parsedProducts++
        log.info(`✅ Parsed: ${productData.name}`)
      } else {
        log.error(`❌ Failed to parse: ${result.error}`)
        stats.failedProducts++
      }
      
      logProgress()
      
      // Batch pause: every 200 products → pause 5 minutes
      if (stats.parsedProducts > 0 && stats.parsedProducts % 200 === 0) {
        stats.batchCount++
        console.log(`\n⏸️  Batch ${stats.batchCount} completed (${stats.parsedProducts} products). Pausing for 5 minutes...\n`)
        const pauseStart = Date.now()
        await randomDelay(5 * 60 * 1000, 5 * 60 * 1000 + 30000) // 5-5.5 min
        stats.pauseTime += Date.now() - pauseStart
        console.log(`▶️  Resuming parsing...\n`)
      }
    },
  })
  
  await productCrawler.run(productUrls)
  
  // Export to CSV
  const timestamp = new Date().toISOString().split('T')[0]
  const csvFilename = `stealth-${timestamp}.csv`
  await Dataset.exportToCSV(csvFilename)
  
  console.log(`💾 CSV saved to: storage/datasets/default/${csvFilename}`)
  
  console.log(`\n✅ Parsing completed!`)
  console.log(`📊 Total: ${stats.totalProducts} | Parsed: ${stats.parsedProducts} | Failed: ${stats.failedProducts}`)
  console.log(`💾 CSV saved to: storage/datasets/default/${csvFilename}`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
