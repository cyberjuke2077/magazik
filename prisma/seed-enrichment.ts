import { prisma } from '../src/lib/prisma'

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: 'uncategorized' },
    create: { name: 'Без категории', slug: 'uncategorized' },
    update: {},
  })

  console.log(`✓ Seed category created/verified: "${category.name}" (id: ${category.id})`)
}

main()
  .catch((error) => {
    console.error('✗ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
