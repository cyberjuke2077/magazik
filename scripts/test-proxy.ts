/**
 * Test Proxy Connection
 * 
 * Simple script to test if proxies work with Playwright
 */

import 'dotenv/config'
import { chromium } from 'playwright'
import { readFileSync } from 'fs'
import { createProxyManager, formatProxyUrl, type ProxyConfig } from '../src/lib/proxy/index.js'

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

async function testProxy() {
  console.log('🧪 Testing proxy connection...\n')
  
  // Load proxies
  const proxies = loadProxiesFromEnv()
  
  if (proxies.length === 0) {
    console.error('❌ No proxies loaded')
    process.exit(1)
  }
  
  // Create proxy manager
  const proxyManager = createProxyManager(proxies.slice(0, 5), {
    rotationStrategy: 'round-robin',
    maxFailuresBeforeRemoval: 3,
  })
  
  console.log(`✅ Testing with first 5 proxies\n`)
  
  // Test first 3 proxies
  for (let i = 0; i < 3; i++) {
    const proxy = proxyManager.getNext()
    
    if (!proxy) {
      console.error('❌ No healthy proxies available')
      break
    }
    
    console.log(`\n[${i + 1}/3] Testing proxy: ${proxy.host}:${proxy.port} (${proxy.username})`)
    
    try {
      const browser = await chromium.launch({
        headless: true,
        proxy: {
          server: `http://${proxy.host}:${proxy.port}`,
          username: proxy.username,
          password: proxy.password,
        },
      })
      
      const context = await browser.newContext()
      const page = await context.newPage()
      
      console.log('  ⏳ Loading ChipDip homepage...')
      
      const response = await page.goto('https://www.chipdip.ru/', {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      })
      
      const status = response?.status()
      const title = await page.title()
      
      console.log(`  ✅ Status: ${status}`)
      console.log(`  ✅ Title: ${title}`)
      
      // Check if blocked
      if (title.includes('Все нормально, я не робот') || 
          title.includes('Доступ ограничен') ||
          title.includes('403')) {
        console.log('  ⚠️  Blocked by captcha/firewall')
        proxyManager.markFailure(proxy, 'Blocked by captcha')
      } else {
        console.log('  ✅ Proxy works!')
        proxyManager.markSuccess(proxy)
      }
      
      await browser.close()
      
    } catch (error) {
      console.error(`  ❌ Error: ${error}`)
      proxyManager.markFailure(proxy, String(error))
    }
    
    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Print stats
  console.log('\n\n📊 Proxy Test Results:')
  console.log(`Healthy proxies: ${proxyManager.getHealthyCount()}/5`)
  
  const stats = proxyManager.getStats()
  stats.forEach((p, i) => {
    const status = p.stats.isHealthy ? '✅' : '❌'
    console.log(`${status} Proxy ${i + 1}: ${p.config.host}:${p.config.port} | Requests: ${p.stats.totalRequests} | Success: ${p.stats.successfulRequests} | Failed: ${p.stats.failedRequests}`)
    if (p.stats.lastError) {
      console.log(`   Last error: ${p.stats.lastError}`)
    }
  })
}

testProxy().catch(console.error)
