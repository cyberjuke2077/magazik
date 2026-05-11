import { chromium } from 'rebrowser-playwright'
import { parseProductPage } from './src/lib/parser/product-parser'

async function test() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  await page.goto('https://www.chipdip.ru/product/drayver-cd4543bm-tr-hgsemi-8055726723', { waitUntil: 'networkidle' })
  await page.waitForTimeout(5000)
  
  const html = await page.content()
  const result = parseProductPage(html)
  
  console.log('Parse result:', result)
  
  if (result.success) {
    console.log('\n✅ Success!')
    console.log('Name:', result.data.name)
    console.log('Part Number:', result.data.partNumber)
    console.log('Manufacturer:', result.data.manufacturer)
    console.log('Category:', result.data.category)
  } else {
    console.log('\n❌ Failed:', result.error)
  }
  
  await browser.close()
}

test().catch(console.error)
