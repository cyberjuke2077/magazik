import { getProductBySlug } from '../src/lib/queries/products'

async function testProductImages() {
  const product = await getProductBySlug('stm32f103c8t6')
  
  if (!product) {
    console.log('Product not found')
    return
  }
  
  console.log(`Product: ${product.name}`)
  console.log(`Images: ${product.images.length}`)
  product.images.forEach((url, i) => {
    console.log(`  ${i + 1}. ${url}`)
  })
}

testProductImages().catch(console.error)
