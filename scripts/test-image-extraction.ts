import { createBrowserClient } from '../src/lib/parser/browser-client'
import { parseProductPage } from '../src/lib/parser/product-parser'

async function testImageExtraction() {
  const browserClient = await createBrowserClient()
  
  try {
    console.log('Fetching STM32F103C8T6 product page...')
    const html = await browserClient.fetchPage('https://www.chipdip.ru/product/stm32f103c8t6')
    
    console.log('Parsing product data...')
    const result = parseProductPage(html)
    
    if (!result.success) {
      console.error('Parse failed:', result.error)
      return
    }
    
    const product = result.data
    console.log(`\n✅ Product: ${product.name}`)
    console.log(`📦 Part Number: ${product.partNumber}`)
    console.log(`🏭 Manufacturer: ${product.manufacturer}`)
    console.log(`\n📸 Images found: ${product.images.length}`)
    
    product.images.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`)
    })
    
  } finally {
    await browserClient.close()
  }
}

testImageExtraction().catch(console.error)
