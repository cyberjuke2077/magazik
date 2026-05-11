import { chromium } from 'rebrowser-playwright'
import { parseProductPage } from './src/lib/parser/product-parser'

async function test() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  
  const url = 'https://www.chipdip.ru/product/drayver-cd4543bm-tr-hgsemi-8055726723'
  console.log('Opening:', url)
  
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  
  const html = await page.content()
  const title = await page.title()
  
  console.log('Title:', title)
  console.log('HTML length:', html.length)
  console.log('Contains product data:', html.includes('product__params'))
  
  const productData = parseProductPage(html)
  console.log('\nParsed data:')
  console.log('- Name:', productData.name)
  console.log('- Part Number:', productData.partNumber)
  console.log('- Manufacturer:', productData.manufacturer)
  console.log('- Category:', productData.category)
  
  await browser.close()
}

test().catch(console.error)
