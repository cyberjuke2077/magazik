import { prisma } from '../src/lib/prisma'

async function checkImages() {
  const totalImages = await prisma.productImage.count()
  console.log(`📸 Total images in database: ${totalImages}`)
  
  const productsWithImages = await prisma.product.findMany({
    include: {
      images: true,
    },
    take: 5,
  })
  
  console.log('\n📦 Sample products with images:\n')
  productsWithImages.forEach(p => {
    console.log(`${p.name}`)
    console.log(`  Images: ${p.images.length}`)
    p.images.slice(0, 2).forEach((img, i) => {
      console.log(`    ${i + 1}. ${img.imageUrl}`)
    })
    console.log()
  })
  
  await prisma.$disconnect()
}

checkImages().catch(console.error)
