import { prisma } from '../src/lib/prisma'

async function checkDatasheets() {
  const product = await prisma.product.findFirst({
    include: {
      datasheets: true,
    },
    where: {
      datasheets: {
        some: {},
      },
    },
  })

  if (product) {
    console.log('Product:', product.name)
    console.log('\nDatasheets:')
    product.datasheets.forEach((ds, i) => {
      console.log(`${i + 1}. ${ds.title}`)
      console.log(`   URL: ${ds.url}`)
    })
  } else {
    console.log('No products with datasheets found')
  }

  await prisma.$disconnect()
}

checkDatasheets().catch(console.error)
