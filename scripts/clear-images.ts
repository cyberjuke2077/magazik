/**
 * Clear all product images from database
 * Images from ChipDip have watermarks and low quality
 * Will be added manually via admin panel later
 */

import { prisma } from '../src/lib/prisma'

async function clearImages() {
  console.log('🗑️  Clearing all product images from database...\n')

  try {
    const result = await prisma.productImage.deleteMany({})
    
    console.log(`✅ Deleted ${result.count} images from database`)
    console.log('\nImages will be added manually via admin panel.')
    
  } catch (error) {
    console.error('❌ Error clearing images:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearImages()
