/**
 * ChipDip Parser with Proxy Support
 * 
 * Advanced parser with:
 * - 20,000 Webshare residential proxies
 * - Automatic proxy rotation
 * - Health tracking and failover
 * - Rebrowser-playwright (stealth)
 * - Fingerprint randomization
 * - 2captcha solver
 * - Adaptive strategies
 */

import 'dotenv/config'
import { chromium } from 'rebrowser-playwright'
import { PlaywrightCrawler, Dataset } from 'crawlee'
import { FingerprintGenerator } from 'fingerprint-generator'
import { parseProductPage } from '../src/lib/parser/product-parser'
import { prisma } from '../src/lib/prisma'
import { TwoCaptchaSolver } from '../src/lib/captcha/2captcha-solver'
import { createProxyManager, type ProxyConfig } from '../src/lib/proxy'
import { readFileSync } from 'fs'

// Load proxies from .env.proxies
function loadProxiesFromEnv(): ProxyConfig[] {
  try {
    const envContent = readFileSync('.env.proxies', 'utf-8')
    const proxies: ProxyConfig[] = []
    
    const lines = envContent.split('\n')
    for (const line of lines) {
      if (line.startsWith('PROXY_')) {
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
    }
    
    return proxies
  } catch (error) {
    console.error('Failed to load proxies from .env.proxies:', error)
    return []
  }
}

// Initialize proxy manager
const proxies = loadProxiesFromEnv()
const proxyManager = createProxyManager(proxies, {
  rotationStrategy: 'round-robin',
  maxFailuresBeforeRemoval: 3,
})

console.log(`🔐 Loaded ${proxyManager.getTotalCount()} proxies`)
console.log(`✅ Healthy proxies: ${proxyManager.getHealthyCount()}`)

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
  { name: 'Fast', maxConcurrency: 10, maxRequestsPerMinute: 120, delayMs: 2000 },
  { name: 'Medium', maxConcurrency: 5, maxRequestsPerMinute: 60, delayMs: 4000 },
  { name: 'Slow', maxConcurrency: 2, maxRequestsPerMinute: 20, delayMs: 6000 },
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
  proxyRotations: 0,
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
    const captchaContainer = await page.$('#captcha-container')
    if (!captchaContainer) return null

    const sitekey = await page.evaluate(() => {
      const container = document.querySelector('#captcha-container')
      if (!container) return null
      
      const dataKey = container.getAttribute('data-sitekey')
      if (dataKey) return dataKey

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
    const sitekey = await detectYandexCaptcha(page)
    if (!sitekey) {
      log('Captcha detected but no sitekey found', 'warning')
      return false
    }

    log(`Solving Yandex SmartCaptcha (sitekey: ${sitekey})...`, 'info')
    
    const token = await captchaSolver.solveYandexCaptcha(url, sitekey)
    
    if (!token) {
      log('Failed to solve captcha', 'error')
      return false
    }

    await page.evaluate((captchaToken: string) => {
      const callback = (window as any).smartCaptchaCallback
      if (callback) callback(captchaToken)
    }, token)

    await page.waitForTimeout(2000)
    
    stats.captchaSolvedCount++
    log('Captcha solved successfully', 'success')
    return true
  } catch (error) {
    log(`Captcha solving error: ${error}`, 'error')
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)
  const categorySlugs = args.length > 0 ? args : []
  
  log('🚀 Starting ChipDip parser with proxy support')
  log(`📦 Categories: ${categorySlugs.length > 0 ? categorySlugs.join(', ') : 'ALL'}`)
  log(`🔐 Proxies: ${proxyManager.getHealthyCount()}/${proxyManager.getTotalCount()}`)
  
  let categories
  if (categorySlugs.length > 0) {
    categories = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
      select: { id: true, name: true, slug: true },
    })
  } else {
    const rootCategory = await prisma.category.findFirst({
      where: { slug: 'category-1730' },
    })
    
    if (!rootCategory) {
      log('Root category not found', 'error')
      process.exit(1)
    }
    
    const level1Categories = await prisma.category.findMany({
      where: { parentId: rootCategory.id },
      select: { id: true },
    })
    
    categories = await prisma.category.findMany({
      where: {
        parentId: { in: level1Categories.map(c => c.id) },
        slug: { not: { startsWith: '/catalog-show/' } },
      },
      select: { id: true, name: true, slug: true },
    })
  }
  
  log(`📦 Found ${categories.length} categories to parse`)
  
  const productUrls: string[] = []
  
  for (const category of categories) {
    log(`Processing category: ${category.name}`)
    
    const catalogUrl = `https://www.chipdip.ru/catalog/${category.slug}`
    
    const strategy = getCurrentStrategy()
    
    const crawler = PlaywrightCrawler.create({
      maxConcurrency: strategy.maxConcurrency,
      maxRequestsPerMinute: strategy.maxRequestsPerMinute,
      
      launchContext: {
        launcher: chromium,
        launchOptions: {
          headless: true,
        },
      },
      
      async requestHandler({ page, request }) {
        // Get next proxy
        const proxy = proxyManager.getNext()
        if (!proxy) {
          log('No healthy proxies available!', 'error')
          throw new Error('No healthy proxies')
        }
        
        stats.proxyRotations++
        
        try {
          // Set proxy for this page
          await page.context().setProxy({
            server: `http://${proxy.host}:${proxy.port}`,
            username: proxy.username,
            password: proxy.password,
          })
          
          // Apply fingerprint
          const fingerprint = fingerprintGenerator.getFingerprint()
          await page.setViewportSize(fingerprint.screen)
          await page.setUserAgent(fingerprint.navigator.userAgent)
          
          await page.goto(request.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
          
          // Check for captcha
          const hasCaptcha = await detectYandexCaptcha(page)
          if (hasCaptcha) {
            captchaCount++
            log(`Captcha detected (count: ${captchaCount})`, 'warning')
            
            const solved = await solveYandexCaptcha(page, request.url)
            if (!solved) {
              blockCount++
              if (blockCount >= 3) {
                downgradeStrategy()
                blockCount = 0
              }
              proxyManager.markFailure(proxy, 'Captcha not solved')
              return
            }
          }
          
          // Extract product links
          const links = await page.$$eval('a[href*="/product/"]', (anchors) =>
            anchors.map((a) => (a as HTMLAnchorElement).href)
          )
          
          productUrls.push(...links)
          proxyManager.markSuccess(proxy)
          
          log(`Found ${links.length} products in ${category.name}`)
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          log(`Request failed: ${errorMsg}`, 'error')
          proxyManager.markFailure(proxy, errorMsg)
        }
      },
    })
    
    await crawler.run([catalogUrl])
  }
  
  log(`📊 Total product URLs collected: ${productUrls.length}`)
  log(`🔐 Proxy stats: ${proxyManager.getHealthyCount()}/${proxyManager.getTotalCount()} healthy`)
  log(`🔄 Total proxy rotations: ${stats.proxyRotations}`)
  log(`🧩 Captchas solved: ${stats.captchaSolvedCount}`)
  
  const elapsed = (Date.now() - stats.startTime) / 1000
  log(`⏱️  Completed in ${elapsed.toFixed(2)}s`)
}

main().catch(console.error)
