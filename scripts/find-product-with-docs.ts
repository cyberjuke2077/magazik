import { prisma } from '../src/lib/prisma'

async function findProductWithDatasheets() {
  const product = await prisma.product.findFirst({
    where: {
      datasheets: {
        some: {},
      },
    },
    select: {
      slug: true,
      name: true,
    },
  })

  if (product) {
    console.log('Product with datasheets:')
    console.log('Name:', product.name)
    console.log('URL: http://localhost:3000/product/' + product.slug)
  } else {
    console.log('No products with datasheets found')
  }

  await prisma.$disconnect()
}

findProductWithDatasheets().catch(console.error)
