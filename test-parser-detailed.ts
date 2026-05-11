import { chromium } from 'rebrowser-playwright'
import { extractProductName, extractPartNumber, extractManufacturer, extractCategory } from './src/lib/parser/product-parser'
import * as cheerio from 'cheerio'

async function test() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  await page.goto('https://www.chipdip.ru/product/drayver-cd4543bm-tr-hgsemi-8055726723', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)
  
  const html = await page.content()
  const $ = cheerio.load(html)
  
  console.log('=== Testing individual extractors ===')
  console.log('Name:', extractProductName($))
  console.log('Part Number:', extractPartNumber($))
  console.log('Manufacturer:', extractManufacturer($))
  console.log('Category:', extractCategory($))
  
  await browser.close()
}

test().catch(console.error)
