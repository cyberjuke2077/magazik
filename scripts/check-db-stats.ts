import { prisma } from '../src/lib/prisma'

async function checkStats() {
  const products = await prisma.product.count()
  const manufacturers = await prisma.manufacturer.count()
  const categories = await prisma.category.count()
  const specifications = await prisma.specification.count()
  const datasheets = await prisma.datasheet.count()
  
  console.log('Database Statistics:')
  console.log('='.repeat(40))
  console.log(`Products: ${products}`)
  console.log(`Manufacturers: ${manufacturers}`)
  console.log(`Categories: ${categories}`)
  console.log(`Specifications: ${specifications}`)
  console.log(`Datasheets: ${datasheets}`)
  
  // Get sample products
  const sampleProducts = await prisma.product.findMany({
    take: 5,
    include: {
      manufacturer: true,
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  
  console.log('\nRecent Products:')
  console.log('='.repeat(40))
  sampleProducts.forEach((p) => {
    console.log(`- ${p.name}`)
    console.log(`  Manufacturer: ${p.manufacturer.name}`)
    console.log(`  Category: ${p.category?.name || 'N/A'}`)
  })
  
  await prisma.$disconnect()
}

checkStats().catch(console.error)
