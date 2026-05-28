import { prisma } from '../src/lib/prisma'

interface StatusCount {
  enrichmentStatus: string
  _count: { _all: number }
}

interface ImageProvenanceRow {
  source: string
  count: bigint
}

async function checkStats() {
  const [
    products,
    manufacturers,
    categories,
    specifications,
    datasheets,
    productImages,
    productsWithImages,
    statusBreakdown,
    imageProvenance,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.manufacturer.count(),
    prisma.category.count(),
    prisma.specification.count(),
    prisma.datasheet.count(),
    prisma.productImage.count(),
    prisma.product.count({ where: { images: { some: {} } } }),
    prisma.product.groupBy({
      by: ['enrichmentStatus'],
      _count: { _all: true },
    }) as Promise<StatusCount[]>,
    prisma.$queryRaw<ImageProvenanceRow[]>`
      SELECT
        COALESCE("enrichmentMeta"->'images'->>'source', 'none') AS source,
        COUNT(*)::bigint AS count
      FROM "Product"
      GROUP BY source
      ORDER BY count DESC
    `,
  ])

  console.log('Database Statistics')
  console.log('='.repeat(50))
  console.log(`Products:        ${products}`)
  console.log(`Manufacturers:   ${manufacturers}`)
  console.log(`Categories:      ${categories}`)
  console.log(`Specifications:  ${specifications}`)
  console.log(`Datasheets:      ${datasheets}`)
  console.log(`ProductImages:   ${productImages}`)
  console.log(
    `With images:     ${productsWithImages}/${products} (${pct(productsWithImages, products)})`,
  )

  console.log('\nEnrichment status breakdown')
  console.log('-'.repeat(50))
  for (const row of statusBreakdown.sort((a, b) => b._count._all - a._count._all)) {
    const n = row._count._all
    console.log(`  ${row.enrichmentStatus.padEnd(20)} ${String(n).padStart(6)} (${pct(n, products)})`)
  }

  console.log('\nImage source provenance')
  console.log('-'.repeat(50))
  for (const row of imageProvenance) {
    const n = Number(row.count)
    console.log(`  ${row.source.padEnd(20)} ${String(n).padStart(6)} (${pct(n, products)})`)
  }

  // Recent products
  const sampleProducts = await prisma.product.findMany({
    take: 5,
    include: { manufacturer: true, category: true, _count: { select: { images: true } } },
    orderBy: { createdAt: 'desc' },
  })

  console.log('\nRecent products')
  console.log('-'.repeat(50))
  for (const p of sampleProducts) {
    console.log(`  ${p.name}`)
    console.log(`    mfg=${p.manufacturer.name}  cat=${p.category?.name ?? 'N/A'}`)
    console.log(`    status=${p.enrichmentStatus}  images=${p._count.images}`)
  }

  await prisma.$disconnect()
}

function pct(n: number, total: number): string {
  if (total === 0) return '0%'
  return `${((n / total) * 100).toFixed(1)}%`
}

checkStats().catch((err) => {
  console.error(err)
  process.exit(1)
})
