import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface Category {
  id: string
  slug: string
  name: string
  icon: string
  count: number
  description: string
  color: string
}

export interface CategoryWithChildren {
  id: string
  slug: string
  name: string
  icon: string | null
  description: string | null
  children: {
    id: string
    slug: string
    name: string
    icon: string | null
  }[]
}

export async function getCategories(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    icon: cat.icon || '◆',
    count: cat._count.products,
    description: cat.description || '',
    color: cat.color || 'from-gray-500/20 to-gray-600/5',
  }))
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  if (!category) return null

  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    icon: category.icon || '◆',
    count: category._count.products,
    description: category.description || '',
    color: category.color || 'from-gray-500/20 to-gray-600/5',
  }
}

/**
 * Get all level 1 categories with their children (level 2)
 * For catalog dropdown menu
 */
export async function getCategoriesWithChildren(): Promise<CategoryWithChildren[]> {
  // Find root category "Электронные компоненты"
  const rootCategory = await prisma.category.findFirst({
    where: {
      slug: {
        startsWith: 'category-',
      },
      parentId: null,
    },
  })

  if (!rootCategory) {
    return []
  }

  // Get all level 1 categories (children of root)
  const level1Categories = await prisma.category.findMany({
    where: {
      parentId: rootCategory.id,
    },
    orderBy: {
      name: 'asc',
    },
    include: {
      children: {
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          slug: true,
          name: true,
          icon: true,
        },
      },
    },
  })

  return level1Categories
}

/**
 * Get category tree for catalog page
 * Returns root category with all descendants
 */
export async function getCategoryTree() {
  const rootCategory = await prisma.category.findFirst({
    where: {
      slug: {
        startsWith: 'category-',
      },
      parentId: null,
    },
    include: {
      children: {
        orderBy: {
          name: 'asc',
        },
        include: {
          children: {
            orderBy: {
              name: 'asc',
            },
          },
        },
      },
    },
  })

  return rootCategory
}

/**
 * Get total product count across all categories
 */
export async function getTotalProductCount(): Promise<number> {
  const count = await prisma.product.count()
  return count
}

export interface CategoryWithCount {
  id: string
  slug: string
  name: string
  parentId: string | null
  productCount: number
  children: CategoryWithCount[]
}

/**
 * Get all categories with product counts, structured as a tree.
 * Returns only root-level categories (parentId === null) with nested children.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Build a map of all categories
  const categoryMap = new Map<string, CategoryWithCount>()
  for (const cat of categories) {
    categoryMap.set(cat.id, {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      parentId: cat.parentId,
      productCount: cat._count.products,
      children: [],
    })
  }

  // Build tree structure
  const roots: CategoryWithCount[] = []
  for (const cat of categoryMap.values()) {
    if (cat.parentId === null) {
      roots.push(cat)
    } else {
      const parent = categoryMap.get(cat.parentId)
      if (parent) {
        parent.children.push(cat)
      }
    }
  }

  // Sort children alphabetically
  for (const cat of categoryMap.values()) {
    cat.children.sort((a, b) => a.name.localeCompare(b.name))
  }

  return roots
}

export interface ManufacturerWithCount {
  id: string
  slug: string
  name: string
  productCount: number
}

/**
 * Get manufacturers with product counts, filtered by category and/or search query.
 * Returns only manufacturers that have at least 1 matching product.
 * Ordered by productCount DESC, then name ASC.
 */
export async function getManufacturersWithCounts(
  categorySlug?: string | null,
  query?: string | null,
): Promise<ManufacturerWithCount[]> {
  // When FTS query is provided, use raw SQL for search vector matching
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

    if (categorySlug) {
      conditions.push(Prisma.sql`c.slug = ${categorySlug}`)
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`

    const results = await prisma.$queryRaw<
      Array<{ id: string; slug: string; name: string; productCount: bigint }>
    >`
      SELECT m.id, m.slug, m.name, COUNT(p.id)::bigint as "productCount"
      FROM "Manufacturer" m
      JOIN "Product" p ON p."manufacturerId" = m.id
      JOIN "Category" c ON p."categoryId" = c.id
      ${whereClause}
      GROUP BY m.id, m.slug, m.name
      HAVING COUNT(p.id) > 0
      ORDER BY COUNT(p.id) DESC, m.name ASC
    `

    return results.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      productCount: Number(r.productCount),
    }))
  }

  // No FTS query — use Prisma
  const where = categorySlug
    ? { products: { some: { category: { slug: categorySlug } } } }
    : { products: { some: {} } }

  const manufacturers = await prisma.manufacturer.findMany({
    where,
    include: {
      _count: {
        select: {
          products: categorySlug
            ? { where: { category: { slug: categorySlug } } }
            : true,
        },
      },
    },
    orderBy: [
      { products: { _count: 'desc' } },
      { name: 'asc' },
    ],
  })

  return manufacturers
    .map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      productCount: m._count.products,
    }))
    .filter((m) => m.productCount > 0)
}
