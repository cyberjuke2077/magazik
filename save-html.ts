import { chromium } from 'rebrowser-playwright'
import * as fs from 'fs'

async function test() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  await page.goto('https://www.chipdip.ru/product/drayver-cd4543bm-tr-hgsemi-8055726723', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)
  
  const html = await page.content()
  fs.writeFileSync('chipdip-product.html', html)
  console.log('Saved to chipdip-product.html')
  console.log('HTML length:', html.length)
  
  await browser.close()
}

test().catch(console.error)
