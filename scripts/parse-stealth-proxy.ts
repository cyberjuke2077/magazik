/**
 * Fast Stealth ChipDip Parser with Proxy Support
 * 
 * Features:
 * - 20,000 residential proxies with automatic rotation
 * - Automatic dead proxy detection and skipping
 * - 3 parallel browsers (optimized for memory)
 * - Stealth plugin (17 evasion techniques)
 * - Random delays 3-4 seconds between requests
 * - Batch processing: 20 products → rotate proxy + cleanup memory
 * - Human-like behavior: scrolling, mouse movements
 * - User-Agent rotation
 * - Proxy health tracking and automatic failover
 * - Explicit memory cleanup after each batch
 * - Speed: ~40-60 products/hour (optimized for stability and memory)
 */

import 'dotenv/config'
import { PlaywrightCrawler, Dataset } from 'crawlee'
import { PrismaClient } from '@prisma/client'
import { parseProductPage } from '../src/lib/parser/product-parser.js'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { readFileSync } from 'fs'
import { createProxyManager, formatProxyUrl, type ProxyConfig, type ProxyManager } from '../src/lib/proxy/index.js'

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

/**
 * Load proxies from .env.proxies file
 */
function loadProxiesFromEnv(): ProxyConfig[] {
  console.log('📦 Loading proxies from .env.proxies...')
  
  try {
    const content = readFileSync('.env.proxies', 'utf-8')
    const lines = content.split('\n')
    const proxies: ProxyConfig[] = []
    
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim() || !line.includes('PROXY_')) {
        continue
      }
      
      // Parse: PROXY_N=http://username:password@host:port
      const match = line.match(/PROXY_\d+=http:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/)
      if (match) {
        const [, username, password, host, port] = match
        proxies.push({
          host,
          port: parseInt(port, 10),
          username,
          password,
        })
      }
    }
    
    console.log(`✅ Loaded ${proxies.length} proxies`)
    return proxies
  } catch (error) {
    console.error('❌ Failed to load proxies:', error)
    return []
  }
}

/**
 * Test if proxy is working by making a simple request to ChipDip
 */
async function testProxy(proxy: ProxyConfig): Promise<boolean> {
  try {
    const browser = await chromium.launch({
      headless: true,
      proxy: {
        server: `http://${proxy.host}:${proxy.port}`,
        username: proxy.username,
        password: proxy.password,
      },
    })
    
    const page = await browser.newPage()
    await page.setDefaultTimeout(10000) // 10 second timeout for test
    
    // Try to load ChipDip homepage
    const response = await page.goto('https://www.chipdip.ru/', { waitUntil: 'domcontentloaded' })
    await browser.close()
    
    // Check if we got a successful response
    return response?.status() === 200
  } catch (error) {
    return false
  }
}

/**
 * Get next working proxy by testing each one
 */
async function getNextWorkingProxy(proxyManager: ProxyManager, maxAttempts: number = 50): Promise<ProxyConfig | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const proxy = proxyManager.getNext()
    if (!proxy) {
      console.log('❌ No more proxies available')
      return null
    }
    
    console.log(`🔍 Testing proxy ${i + 1}/${maxAttempts}: ${proxy.username}...`)
    const isWorking = await testProxy(proxy)
    
    if (isWorking) {
      console.log(`✅ Proxy ${proxy.username} is working!`)
      return proxy
    } else {
      console.log(`❌ Proxy ${proxy.username} failed test, marking as unhealthy`)
      proxyManager.markFailure(proxy)
    }
  }
  
  console.log(`❌ Could not find working proxy after ${maxAttempts} attempts`)
  return null
}

// Statistics
const stats = {
  totalProducts: 0,
  parsedProducts: 0,
  failedProducts: 0,
  startTime: Date.now(),
  batchCount: 0,
  pauseTime: 0,
  proxyRotations: 0,
  blockedRequests: 0,
}

function logProgress(proxyManager: ProxyManager) {
  const elapsed = (Date.now() - stats.startTime - stats.pauseTime) / 1000 / 60 // minutes
  const speed = elapsed > 0 ? stats.parsedProducts / elapsed : 0
  const progress = stats.totalProducts > 0 ? (stats.parsedProducts / stats.totalProducts * 100).toFixed(1) : '0.0'
  const eta = stats.totalProducts > 0 && speed > 0 
    ? ((stats.totalProducts - stats.parsedProducts) / speed).toFixed(0)
    : '?'
  
  const healthyProxies = proxyManager.getHealthyCount()
  const totalProxies = proxyManager.getTotalCount()
  
  console.log(`📊 Progress: ${stats.parsedProducts}/${stats.totalProducts} (${progress}%) | Speed: ${speed.toFixed(1)} products/min | ETA: ${eta} min | Failed: ${stats.failedProducts} | Blocked: ${stats.blockedRequests}`)
  console.log(`🔄 Proxy rotations: ${stats.proxyRotations} | Healthy proxies: ${healthyProxies}/${totalProxies}`)
}

/**
 * Main crawler function
 */
async function main() {
  const args = process.argv.slice(2)
  const categorySlugs = args.length > 0 ? args : []
  
  console.log('🚀 Starting Fast Stealth Parser with Proxy Support...')
  console.log(`📦 Categories: ${categorySlugs.length > 0 ? categorySlugs.join(', ') : 'ALL'}`)
  console.log('⚙️  Settings: 10 browsers, 120 req/min, 3-4 sec delays, batch 200 → pause 5 min\n')
  
  // Load proxies
  const proxies = loadProxiesFromEnv()
  
  if (proxies.length === 0) {
    console.error('❌ No proxies loaded. Exiting.')
    process.exit(1)
  }
  
  console.log(`✅ Loaded ${proxies.length} proxies. Will test each proxy before use.`)
  
  // Create proxy manager
  const proxyManager = createProxyManager(proxies, {
    rotationStrategy: 'round-robin',
    maxFailuresBeforeRemoval: 3,
  })
  
  console.log(`✅ Proxy manager initialized with ${proxyManager.getTotalCount()} proxies (skipped first 100)\n`)
  
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
    
    // Get proxy for catalog crawling
    const catalogProxy = await getNextWorkingProxy(proxyManager)
    if (!catalogProxy) {
      console.error('❌ No healthy proxies available')
      break
    }
    
    stats.proxyRotations++
    console.log(`🔄 Using proxy: ${catalogProxy.host}:${catalogProxy.port} (${catalogProxy.username})`)
    
    // Fetch catalog page to get product links with pagination
    const catalogCrawler = new PlaywrightCrawler({
      launchContext: {
        launcher: chromium,
        launchOptions: {
          headless: true,
          proxy: {
            server: `http://${catalogProxy.host}:${catalogProxy.port}`,
            username: catalogProxy.username,
            password: catalogProxy.password,
          },
        },
      },
      maxConcurrency: 1,
      maxRequestsPerMinute: 30,
      navigationTimeoutSecs: 120, // Увеличенный таймаут для медленных прокси
      maxRequestRetries: 5, // Больше попыток
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
        
        try {
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
          
          // Mark proxy as successful
          proxyManager.markSuccess(catalogProxy)
          
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
        } catch (error) {
          log.error(`Failed to fetch catalog: ${error}`)
          proxyManager.markFailure(catalogProxy, String(error))
        }
      },
    })
    
    await catalogCrawler.run([catalogUrl])
    console.log(`✅ Collected ${productUrls.length} product URLs so far`)
  }
  
  console.log(`\n✅ Total product URLs collected: ${productUrls.length}`)
  console.log(`🚀 Starting product parsing with proxy rotation...\n`)
  
  stats.totalProducts = productUrls.length
  
  // Parse in batches with proxy rotation
  const BATCH_SIZE = 20 // Parse 20 products, then rotate proxy (reduced for memory)
  let processedUrls = 0
  
  while (processedUrls < productUrls.length) {
    const batchUrls = productUrls.slice(processedUrls, processedUrls + BATCH_SIZE)
    
    // Get next proxy for this batch
    const batchProxy = await getNextWorkingProxy(proxyManager)
    if (!batchProxy) {
      console.error('❌ No healthy proxies available')
      break
    }
    
    console.log(`\n🔄 Batch ${Math.floor(processedUrls / BATCH_SIZE) + 1}: Processing ${batchUrls.length} products with proxy ${batchProxy.host}:${batchProxy.port}`)
    stats.proxyRotations++
    
    // Parse products with parallel browsers
    const productCrawler = new PlaywrightCrawler({
      maxConcurrency: 3, // 3 parallel browsers (reduced for memory)
      maxRequestsPerMinute: 60, // 1 req/sec (reduced load)
      maxRequestRetries: 3,
      navigationTimeoutSecs: 120, // Увеличенный таймаут для медленных прокси
      
      launchContext: {
        launcher: chromium,
        launchOptions: {
          headless: true,
          proxy: {
            server: `http://${batchProxy.host}:${batchProxy.port}`,
            username: batchProxy.username,
            password: batchProxy.password,
          },
        },
      },
      
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
        log.info(`Using proxy: ${batchProxy.host}:${batchProxy.port}`)
        
        try {
          // Human-like scrolling
          await humanScroll(page)
          
          // Random delay after scrolling
          await randomDelay(500, 1500)
          
          const html = await page.content()
          
          // Check for captcha or block
          const title = await page.title()
          if (title.includes('Все нормально, я не робот') || 
              title.includes('Доступ ограничен') ||
              title.includes('403')) {
            log.error('🚫 Blocked by ChipDip captcha/firewall')
            stats.failedProducts++
            stats.blockedRequests++
            proxyManager.markFailure(batchProxy, 'Blocked by captcha/firewall')
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
            proxyManager.markSuccess(batchProxy)
          } else {
            log.error(`❌ Failed to parse: ${result.error}`)
            stats.failedProducts++
            proxyManager.markFailure(batchProxy, result.error || 'Parse failed')
          }
          
          logProgress(proxyManager)
          
          // Batch pause: every 200 products → pause 5 minutes
          if (stats.parsedProducts > 0 && stats.parsedProducts % 200 === 0) {
            stats.batchCount++
            console.log(`\n⏸️  Batch ${stats.batchCount} completed (${stats.parsedProducts} products). Pausing for 5 minutes...\n`)
            const pauseStart = Date.now()
            await randomDelay(5 * 60 * 1000, 5 * 60 * 1000 + 30000) // 5-5.5 min
            stats.pauseTime += Date.now() - pauseStart
            console.log(`▶️  Resuming parsing...\n`)
          }
        } catch (error) {
          log.error(`Error parsing product: ${error}`)
          stats.failedProducts++
          proxyManager.markFailure(batchProxy, String(error))
        }
      },
    })
    
    await productCrawler.run(batchUrls)
    
    // Explicitly teardown crawler to free memory
    await productCrawler.teardown()
    
    processedUrls += batchUrls.length
    
    console.log(`✅ Batch completed. Processed: ${processedUrls}/${productUrls.length}`)
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
      console.log(`🧹 Memory cleanup triggered`)
    }
  }
  
  // Export to CSV
  const timestamp = new Date().toISOString().split('T')[0]
  const csvFilename = `stealth-proxy-${timestamp}.csv`
  await Dataset.exportToCSV(csvFilename)
  
  console.log(`\n✅ Parsing completed!`)
  console.log(`📊 Total: ${stats.totalProducts} | Parsed: ${stats.parsedProducts} | Failed: ${stats.failedProducts} | Blocked: ${stats.blockedRequests}`)
  console.log(`🔄 Proxy rotations: ${stats.proxyRotations}`)
  console.log(`💾 CSV saved to: storage/datasets/default/${csvFilename}`)
  
  // Print proxy health stats
  console.log(`\n📊 Proxy Health Stats:`)
  console.log(`Healthy proxies: ${proxyManager.getHealthyCount()}/${proxyManager.getTotalCount()}`)
  
  const proxyStats = proxyManager.getStats()
  const unhealthyProxies = proxyStats.filter(p => !p.stats.isHealthy)
  if (unhealthyProxies.length > 0) {
    console.log(`\n⚠️  Unhealthy proxies (${unhealthyProxies.length}):`)
    unhealthyProxies.slice(0, 10).forEach(p => {
      console.log(`  - ${p.config.host}:${p.config.port} | Failures: ${p.stats.failedRequests} | Last error: ${p.stats.lastError}`)
    })
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)
