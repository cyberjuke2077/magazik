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
