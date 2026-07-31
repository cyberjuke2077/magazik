import { Prisma, type Product as PrismaProduct, type Category, type Manufacturer } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { type SortOption } from '@/lib/catalog-utils'
import { getCategorySubtreeSlugs } from '@/lib/queries/categories'

// Transform Prisma product to UI Product type
type ProductWithRelations = PrismaProduct & {
  category: Category
  manufacturer: Manufacturer
  images: Array<{ imageUrl: string; altText: string | null; order: number }>
  specifications: Array<{ key: string; value: string; order: number }>
  datasheets: Array<{ id: string; title: string; url: string }>
}

export interface Product {
  id: string
  slug: string
  name: string
  partNumber: string
  sku: string
  category: string
  categorySlug: string
  manufacturer: string
  manufacturerSlug: string
  price: number
  priceWholesale?: number
  currency: string
  inStock: boolean
  stockCount: number
  unit: string
  minOrder: number
  weight?: number
  description: string
  package: string | null
  lifecycle: string | null
  lastEnrichedAt: string | null
  createdAt: string
  specs: Record<string, string>
  tags: string[]
  featured?: boolean
  images: string[]
  datasheets: Array<{ id: string; title: string; url: string }>
}

function transformProduct(p: ProductWithRelations): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    partNumber: p.partNumber,
    sku: p.sku || '',
    category: p.category.name,
    categorySlug: p.category.slug,
    manufacturer: p.manufacturer.name,
    manufacturerSlug: p.manufacturer.slug,
    price: p.price ? Number(p.price) : 0,
    priceWholesale: p.priceWholesale ? Number(p.priceWholesale) : undefined,
    currency: p.currency,
    inStock: p.inStock,
    stockCount: p.stockCount,
    unit: p.unit,
    minOrder: p.minOrder,
    weight: p.weight ? Number(p.weight) : undefined,
    description: p.description || '',
    package: p.package || null,
    lifecycle: p.lifecycle || null,
    lastEnrichedAt: p.lastEnrichedAt ? p.lastEnrichedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    specs: p.specifications.reduce((acc, spec) => {
      acc[spec.key] = spec.value
      return acc
    }, {} as Record<string, string>),
    tags: p.tags,
    featured: p.featured,
    images: p.images
      .sort((a, b) => a.order - b.order)
      .map(img => img.imageUrl),
    datasheets: p.datasheets.map(ds => ({
      id: ds.id,
      title: ds.title,
      url: ds.url,
    })),
  }
}

function getSortOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'name':
      return { name: 'asc' }
    case 'partNumber':
      return { partNumber: 'asc' }
    case 'manufacturer':
      return { manufacturer: { name: 'asc' } }
    case 'date':
    default:
      return { createdAt: 'desc' }
  }
}

export async function getProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      manufacturer: true,
      images: {
        orderBy: { order: 'asc' },
      },
      specifications: {
        orderBy: { order: 'asc' },
      },
      datasheets: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return products.map(transformProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      manufacturer: true,
      images: {
        orderBy: { order: 'asc' },
      },
      specifications: {
        orderBy: { order: 'asc' },
      },
      datasheets: true,
    },
  })

  if (!product) return null
  return transformProduct(product)
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      category: {
        slug: categorySlug,
      },
    },
    include: {
      category: true,
      manufacturer: true,
      images: {
        orderBy: { order: 'asc' },
      },
      specifications: {
        orderBy: { order: 'asc' },
      },
      datasheets: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return products.map(transformProduct)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { featured: true },
    include: {
      category: true,
      manufacturer: true,
      images: {
        orderBy: { order: 'asc' },
      },
      specifications: {
        orderBy: { order: 'asc' },
      },
      datasheets: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  return products.map(transformProduct)
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      category: true,
      manufacturer: true,
      images: { orderBy: { order: 'asc' } },
      specifications: { orderBy: { order: 'asc' } },
      datasheets: true,
    },
  })

  // Preserve input order so the UI matches the user's compare list ordering
  const byId = new Map(products.map((p) => [p.id, p]))
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(transformProduct)
}

export interface PaginatedResult {
  items: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getProductsPaginated(params: {
  page: number
  limit: number
  query?: string | null
  categorySlug?: string | null
  manufacturerSlug?: string | null
  sort?: SortOption
}): Promise<PaginatedResult> {
  const { page, limit, query, categorySlug, manufacturerSlug, sort = 'date' } = params
  const offset = (page - 1) * limit

  // Раздел каталога фильтрует товары всего поддерева (раздел + подкатегории).
  const categorySlugs = categorySlug ? await getCategorySubtreeSlugs(categorySlug) : null

  // When a search query is provided, use raw SQL for FTS
  if (query) {
    // Build prefix-matching tsquery: "STM32" → "STM32:*", "100k resistor" → "100k:* & resistor:*"
    const tsqueryStr = query
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .map((w) => w.replace(/[!&|()<>:*'\\]/g, '') + ':*')
      .join(' & ')

    if (!tsqueryStr) {
      return { items: [], total: 0, page, limit, totalPages: 0 }
    }

    // Build dynamic WHERE conditions for count and ID queries
    const conditions: Prisma.Sql[] = [
      Prisma.sql`p."searchVector" @@ to_tsquery('simple', ${tsqueryStr})`,
    ]

    if (categorySlugs) {
      conditions.push(Prisma.sql`c.slug IN (${Prisma.join(categorySlugs)})`)
    }
    if (manufacturerSlug) {
      conditions.push(Prisma.sql`m.slug = ${manufacturerSlug}`)
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`

    // Get total count
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Product" p
      JOIN "Category" c ON p."categoryId" = c.id
      JOIN "Manufacturer" m ON p."manufacturerId" = m.id
      ${whereClause}
    `

    const total = Number(countResult[0].count)
    const totalPages = Math.ceil(total / limit)

    if (total === 0) {
      return { items: [], total: 0, page, limit, totalPages: 0 }
    }

    // When FTS is active, always order by relevance regardless of sort param
    const orderByClause = Prisma.sql`ORDER BY ts_rank(p."searchVector", to_tsquery('simple', ${tsqueryStr})) DESC`

    // Get matching IDs ordered by relevance or sort
    const idsResult = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT p.id FROM "Product" p
      JOIN "Category" c ON p."categoryId" = c.id
      JOIN "Manufacturer" m ON p."manufacturerId" = m.id
      ${whereClause}
      ${orderByClause}
      OFFSET ${offset} LIMIT ${limit}
    `

    if (idsResult.length === 0) {
      return { items: [], total, page, limit, totalPages }
    }

    // Fetch full product data with relations
    const products = await prisma.product.findMany({
      where: { id: { in: idsResult.map(r => r.id) } },
      include: {
        category: true,
        manufacturer: true,
        images: { orderBy: { order: 'asc' } },
        specifications: { orderBy: { order: 'asc' } },
        datasheets: true,
      },
    })

    // Preserve order from raw query
    const idOrder = new Map(idsResult.map((r, i) => [r.id, i]))
    products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0))

    return {
      items: products.map(transformProduct),
      total,
      page,
      limit,
      totalPages,
    }
  }

  // No search query — use Prisma findMany with filters
  const where: Prisma.ProductWhereInput = {
    ...(categorySlugs && { category: { slug: { in: categorySlugs } } }),
    ...(manufacturerSlug && { manufacturer: { slug: manufacturerSlug } }),
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        manufacturer: true,
        images: { orderBy: { order: 'asc' } },
        specifications: { orderBy: { order: 'asc' } },
        datasheets: true,
      },
      orderBy: getSortOrderBy(sort),
      skip: offset,
      take: limit,
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    items: products.map(transformProduct),
    total,
    page,
    limit,
    totalPages,
  }
}

/**
 * Get all products matching filters (for CSV export, no pagination)
 */
export async function getProductsForExport(params: {
  query?: string | null
  categorySlug?: string | null
  manufacturerSlug?: string | null
  sort?: SortOption
}): Promise<Product[]> {
  const { query, categorySlug, manufacturerSlug, sort = 'date' } = params
  const categorySlugs = categorySlug ? await getCategorySubtreeSlugs(categorySlug) : null

  if (query) {
    const tsqueryStr = query
      .split(/\s+/)
      .filter((w) => w.length > 0)
      .map((w) => w.replace(/[!&|()<>:*'\\]/g, '') + ':*')
      .join(' & ')

    if (!tsqueryStr) return []

    const conditions: Prisma.Sql[] = [
      Prisma.sql`p."searchVector" @@ to_tsquery('simple', ${tsqueryStr})`,
    ]
    if (categorySlugs) conditions.push(Prisma.sql`c.slug IN (${Prisma.join(categorySlugs)})`)
    if (manufacturerSlug) conditions.push(Prisma.sql`m.slug = ${manufacturerSlug}`)

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`

    const idsResult = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT p.id FROM "Product" p
      JOIN "Category" c ON p."categoryId" = c.id
      JOIN "Manufacturer" m ON p."manufacturerId" = m.id
      ${whereClause}
      ORDER BY ts_rank(p."searchVector", to_tsquery('simple', ${tsqueryStr})) DESC
      LIMIT 10000
    `

    if (idsResult.length === 0) return []

    const products = await prisma.product.findMany({
      where: { id: { in: idsResult.map(r => r.id) } },
      include: {
        category: true,
        manufacturer: true,
        images: { orderBy: { order: 'asc' } },
        specifications: { orderBy: { order: 'asc' } },
        datasheets: true,
      },
    })

    const idOrder = new Map(idsResult.map((r, i) => [r.id, i]))
    products.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0))

    return products.map(transformProduct)
  }

  const where: Prisma.ProductWhereInput = {
    ...(categorySlugs && { category: { slug: { in: categorySlugs } } }),
    ...(manufacturerSlug && { manufacturer: { slug: manufacturerSlug } }),
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      manufacturer: true,
      images: { orderBy: { order: 'asc' } },
      specifications: { orderBy: { order: 'asc' } },
      datasheets: true,
    },
    orderBy: getSortOrderBy(sort),
    take: 10000,
  })

  return products.map(transformProduct)
}
