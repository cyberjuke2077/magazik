import { parseProductPage } from '../src/lib/parser/product-parser.js'
import { createHttpClient, DEFAULT_HTTP_CONFIG } from '../src/lib/parser/http-client.js'
import { createRateLimiter } from '../src/lib/parser/rate-limiter.js'

async function testWeight() {
  console.log('Testing weight extraction...\n')
  
  const rateLimiter = createRateLimiter({ requestsPerSecond: 0.5 })
  const httpClient = createHttpClient(DEFAULT_HTTP_CONFIG, { rateLimiter, fetch: globalThis.fetch })
  
  const url = 'https://www.chipdip.ru/product/stm32f103c8t6'
  console.log('Fetching:', url)
  
  const html = await httpClient.get(url)
  console.log('HTML fetched, length:', html.length)
  
  const result = parseProductPage(html)
  
  if (result.success && result.data) {
    console.log('\n✅ Parse successful!')
    console.log('Product:', result.data.partNumber)
    console.log('Name:', result.data.name)
    console.log('Weight:', result.data.weight)
    console.log('Weight type:', typeof result.data.weight)
    console.log('Manufacturer:', result.data.manufacturer)
    console.log('Category:', result.data.category)
  } else {
    console.log('\n❌ Parse failed:', result.error)
  }
}

testWeight().catch(console.error)
