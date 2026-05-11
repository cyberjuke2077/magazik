/**
 * Check current database and parser status
 */

import { prisma } from '../src/lib/prisma'

async function checkStatus() {
  console.log('📊 Current Status\n')

  try {
    // Products
    const productCount = await prisma.product.count()
    console.log(`✅ Products: ${productCount}`)

    // Manufacturers
    const manufacturerCount = await prisma.manufacturer.count()
    console.log(`✅ Manufacturers: ${manufacturerCount}`)

    // Categories
    const categoryCount = await prisma.category.count()
    console.log(`✅ Categories: ${categoryCount}`)

    // Images (should be 0)
    const imageCount = await prisma.productImage.count()
    console.log(`✅ Images: ${imageCount} (disabled - will be added manually)`)

    // Datasheets
    const datasheetCount = await prisma.datasheet.count()
    console.log(`✅ Datasheets: ${datasheetCount}`)

    // Specifications
    const specCount = await prisma.specification.count()
    console.log(`✅ Specifications: ${specCount}`)

    console.log('\n📝 Parser Status:')
    console.log('  - Images: DISABLED (watermarks + low quality)')
    console.log('  - Weight: ENABLED')
    console.log('  - Datasheets: ENABLED')
    console.log('  - Specifications: ENABLED')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkStatus()
