import { createBrowserClient } from '../src/lib/parser/browser-client'

async function testImageParsing() {
  const browserClient = await createBrowserClient()
  
  try {
    console.log('Fetching product page...')
    const html = await browserClient.fetchPage('https://www.chipdip.ru/product/stm32f103c8t6')
    
    // Find all img tags
    const imgMatches = html.match(/<img[^>]*>/g) || []
    console.log(`\nFound ${imgMatches.length} img tags`)
    
    // Filter product images
    const productImages = imgMatches.filter(img => 
      img.includes('product') || 
      img.includes('photo') || 
      img.includes('gallery') ||
      img.includes('static.chipdip.ru')
    )
    
    console.log(`\nProduct images (${productImages.length}):`)
    productImages.slice(0, 10).forEach((img, i) => {
      console.log(`\n${i + 1}. ${img.substring(0, 200)}...`)
    })
    
    // Look for data attributes
    const dataImageMatches = html.match(/data-[^=]*image[^=]*="[^"]*"/gi) || []
    console.log(`\n\nFound ${dataImageMatches.length} data-*image attributes:`)
    dataImageMatches.slice(0, 10).forEach((attr, i) => {
      console.log(`${i + 1}. ${attr}`)
    })
    
  } finally {
    await browserClient.close()
  }
}

testImageParsing().catch(console.error)
