/**
 * ChipDip Parser using Crawlee
 * 
 * Modern web scraper with:
 * - Parallel processing (multiple browsers)
 * - Automatic retry and error handling
 * - Built-in antibot protection (Stealth Plugin)
 * - User-Agent rotation
 * - Webshare proxy rotation
 * - CSV export
 * - Progress tracking
 */

import 'dotenv/config'
import { PlaywrightCrawler, Dataset, ProxyConfiguration } from 'crawlee'
import { PrismaClient } from '@prisma/client'
import { parseProductPage } from '../src/lib/parser/product-parser.js'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// Enable stealth mode to avoid bot detection
chromium.use(StealthPlugin())

// Webshare proxies configuration
// Format: http://username:password@host:port
// You can also load from .env file or pass as environment variables
function getWebshareProxies(): string[] {
  // DISABLED: Webshare proxies are blocked by ChipDip
  // Using direct connection (your IP is unblocked now)
  const proxies = [
    // Proxies disabled - using direct connection
  ]
  
  // Option 2: Load from environment variables
  for (let i = 1; i <= 10; i++) {
    const proxy = process.env[`WEBSHARE_PROXY_${i}`]
    if (proxy) {
      proxies.push(proxy)
    }
  }
  
  // Option 3: Load from command line arguments
  const proxyArg = process.env.PROXIES
  if (proxyArg) {
    proxies.push(...proxyArg.split(','))
  }
  
  return proxies.filter(p => p && p.trim().length > 0)
}

// User-Agent rotation pool
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
]

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

const prisma = new PrismaClient()

interface CrawlerStats {
  totalProducts: number
  parsedProducts: number
  failedProducts: number
  startTime: number
}

const stats: CrawlerStats = {
  totalProducts: 0,
  parsedProducts: 0,
  failedProducts: 0,
  startTime: Date.now(),
}

/**
 * Main crawler function
 */
async function main() {
  const args = process.argv.slice(2)
  const categorySlugs = args.length > 0 ? args : []
  
  console.log('🚀 Starting Crawlee parser...')
  console.log(`📦 Categories: ${categorySlugs.length > 0 ? categorySlugs.join(', ') : 'ALL'}`)
  
  // Get categories from database
  let categories
  if (categorySlugs.length > 0) {
    // If specific slugs provided, get those categories
    categories = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { id: true, name: true, slug: true },
    })
  } else {
    // Get all Level 2 categories (children of "Электронные компоненты")
    const rootCategory = await prisma.category.findFirst({
      where: { slug: 'category-1730' },
    })
    
    if (!rootCategory) {
      console.error('❌ Root category not found')
      process.exit(1)
    }
    
    const level1Categories = await prisma.category.findMany({
      where: { parentId: rootCategory.id },
      select: { id: true },
    })
    
    categories = await prisma.category.findMany({
      where: {
        parentId: { in: level1Categories.map(c => c.id) },
        slug: { not: { startsWith: '/catalog-show/' } }, // Exclude invalid slugs
      },
      select: { id: true, name: true, slug: true },
    })
  }
  
  console.log(`📦 Found ${categories.length} categories to parse`)
  
  // Get Webshare proxies
  console.log('📡 Loading Webshare proxies...')
  const webshareProxies = getWebshareProxies()
  
  if (webshareProxies.length === 0) {
    console.log('⚠️  No proxies configured - using direct connection (your IP)')
    console.log('✅ Your IP is unblocked, proceeding without proxies\n')
  } else {
    console.log(`✅ Found ${webshareProxies.length} Webshare proxies\n`)
  }
  
  // Configure proxy for catalog crawling (null = no proxy)
  const catalogProxyConfig = webshareProxies.length > 0 
    ? new ProxyConfiguration({ proxyUrls: webshareProxies })
    : undefined // No proxy configuration
  
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
      proxyConfiguration: catalogProxyConfig, // Use proxies for catalog too
      useSessionPool: true,
      persistCookiesPerSession: true,
      maxConcurrency: 1,
      maxRequestsPerMinute: 30,
      preNavigationHooks: [
        async ({ page }) => {
          // Set random User-Agent and headers
          await page.setExtraHTTPHeaders({
            'User-Agent': getRandomUserAgent(),
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          })
        },
      ],
      async requestHandler({ page, request, log, enqueueLinks, session }) {
        log.info(`Fetching catalog: ${request.url}`)
        
        // Check if blocked
        const title = await page.title()
        if (title.includes('Все нормально, я не робот') || title.includes('Доступ ограничен') || title.includes('403') || title.includes('Страница не найдена')) {
          log.warning(`🚫 Catalog blocked or not found - retiring session and trying next proxy`)
          session?.retire()
          return
        }
        
        session?.markGood()
        
        // Wait for products to load (wait for actual product links)
        try {
          await page.waitForSelector('a[href*="/product/"]', { timeout: 10000 })
          await page.waitForTimeout(2000) // Extra time for all products to render
        } catch (e) {
          log.warning('No product links found on page, might be empty category or blocked')
          session?.markBad()
          return
        }
        
        // Get all product links
        const links = await page.$$eval('a[href*="/product/"]', (elements) =>
          elements.map((el) => (el as HTMLAnchorElement).href)
        )
        
        const uniqueLinks = [...new Set(links)]
        productUrls.push(...uniqueLinks)
        
        log.info(`Found ${uniqueLinks.length} products on page`)
        
        // Check for ChipDip pager (not pagination!)
        const pagerExists = await page.$('.pager')
        log.info(`Pager element exists: ${!!pagerExists}`)
        
        if (pagerExists) {
          // ChipDip uses .pager__next for next page button
          const nextButton = await page.$('.pager__next')
          
          if (nextButton) {
            const nextPageUrl = await nextButton.getAttribute('href')
            log.info(`Found next page: ${nextPageUrl}`)
            
            if (nextPageUrl) {
              await enqueueLinks({
                urls: [nextPageUrl.startsWith('http') ? nextPageUrl : `https://www.chipdip.ru${nextPageUrl}`],
                label: 'CATALOG',
              })
              log.info('✅ Next page added to queue')
            }
          } else {
            log.info('⚠️  No next page button - this is the last page')
          }
        } else {
          log.info('⚠️  No pager element found on page')
        }
      },
    })
    
    await catalogCrawler.run([catalogUrl])
  }
  
  console.log(`\n✅ Found ${productUrls.length} total products across all categories`)
  console.log(`🚀 Starting product parsing${webshareProxies.length > 0 ? ' with proxy rotation' : ' with direct connection'}...\n`)
  
  stats.totalProducts = productUrls.length
  
  // Configure proxy rotation with Webshare proxies (or no proxy if empty)
  const proxyConfiguration = webshareProxies.length > 0
    ? new ProxyConfiguration({ proxyUrls: webshareProxies })
    : undefined // No proxy configuration
  
  // Parse products with parallel browsers
  const productCrawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
    },
    proxyConfiguration, // Enable proxy rotation
    useSessionPool: true, // Enable session management
    sessionPoolOptions: { maxPoolSize: 100 }, // Max 100 sessions
    persistCookiesPerSession: true, // Save cookies per session
    maxConcurrency: 5, // 5 browsers (safer with proxies)
    maxRequestsPerMinute: 60, // 1 req/sec (safer with proxies)
    maxRequestRetries: 3,
    
    preNavigationHooks: [
      async ({ page }) => {
        // Set random User-Agent and realistic headers for each request
        await page.setExtraHTTPHeaders({
          'User-Agent': getRandomUserAgent(),
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
        })
      },
    ],
    
    async requestHandler({ page, request, log, session }) {
      try {
        // Wait for page to load
        await page.waitForTimeout(2000)
        
        // Extract slug from URL (e.g., https://www.chipdip.ru/product/stm32f103c8t6 -> stm32f103c8t6)
        const productSlug = request.url.split('/product/')[1]?.split('/')[0]?.split('?')[0] || ''
        
        // Get HTML
        const html = await page.content()
        
        // Check if blocked by ChipDip
        const title = await page.title()
        if (title.includes('Все нормально, я не робот') || title.includes('Доступ ограничен') || title.includes('403')) {
          log.warning(`🚫 Blocked by ChipDip captcha - retiring session`)
          session?.retire() // Mark this proxy as blocked, switch to next one
          stats.failedProducts++
          return
        }
        
        // Parse product data using existing parser
        const result = parseProductPage(html)
        
        if (result.success && result.data) {
          const productData = result.data
          
          // Session is good - mark it
          session?.markGood()
          
          // Get manufacturer slug from database
          let manufacturerSlug = ''
          if (productData.manufacturer) {
            const manufacturer = await prisma.manufacturer.findFirst({
              where: { name: productData.manufacturer },
              select: { slug: true },
            })
            manufacturerSlug = manufacturer?.slug || ''
          }
          
          // Get category slug from database
          let categorySlug = ''
          if (productData.category) {
            const category = await prisma.category.findFirst({
              where: { name: productData.category },
              select: { slug: true },
            })
            categorySlug = category?.slug || ''
          }
          
          // Convert to CSV format
          const csvData = {
            slug: productSlug,
            name: productData.name || '',
            partNumber: productData.partNumber || '',
            sku: productData.sku || '',
            manufacturer: productData.manufacturer || '',
            manufacturerSlug: manufacturerSlug,
            categorySlug: categorySlug,
            categoryName: productData.category || '',
            description: productData.description || '',
            weight: productData.weight || 0,
            specifications: JSON.stringify(productData.specifications || {}),
            datasheets: JSON.stringify(productData.datasheets || []),
            images: '[]',
          }
          
          // Save to dataset (will be exported to CSV)
          await Dataset.pushData(csvData)
          
          stats.parsedProducts++
          
          // Log progress
          const progress = ((stats.parsedProducts + stats.failedProducts) / stats.totalProducts * 100).toFixed(1)
          const elapsed = Math.floor((Date.now() - stats.startTime) / 1000)
          const speed = (stats.parsedProducts / elapsed * 60).toFixed(1)
          
          log.info(`✅ [${progress}%] ${productData.name} (${speed} products/min)`)
        } else {
          // Parsing failed - might be blocked or error
          session?.markBad() // Mark session as potentially bad
          stats.failedProducts++
          console.warn(`⚠️  Failed to parse: ${request.url} - ${result.error}`)
        }
      } catch (error) {
        // Error occurred - mark session as bad
        session?.markBad()
        stats.failedProducts++
        log.error(`❌ Error parsing ${request.url}: ${error}`)
      }
    },
    
    // Error handling
    failedRequestHandler({ request, log, session }, error) {
      // Request failed completely - retire this session/proxy
      session?.retire()
      stats.failedProducts++
      log.error(`Failed request ${request.url}: ${error}`)
    },
  })
  
  // Run crawler
  await productCrawler.run(productUrls)
  
  // Export results
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `./data/parsed/crawlee-${timestamp}.csv`
  
  await productCrawler.exportData(filename)
  
  // Print final stats
  const totalTime = Math.floor((Date.now() - stats.startTime) / 1000)
  const avgSpeed = (stats.parsedProducts / totalTime * 60).toFixed(1)
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Final Statistics')
  console.log('='.repeat(60))
  console.log(`Total products:   ${stats.totalProducts}`)
  console.log(`Parsed:           ${stats.parsedProducts} ✅`)
  console.log(`Failed:           ${stats.failedProducts} ❌`)
  console.log(`Success rate:     ${(stats.parsedProducts / stats.totalProducts * 100).toFixed(1)}%`)
  console.log(`Total time:       ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`)
  console.log(`Average speed:    ${avgSpeed} products/min`)
  console.log(`CSV file:         ${filename}`)
  console.log('='.repeat(60))
  
  await prisma.$disconnect()
}

main().catch(console.error)
