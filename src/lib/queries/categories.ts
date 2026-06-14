import { cache } from 'react'
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

// cache() дедуплицирует запрос в пределах одного рендера — generateMetadata
// и тело страницы зовут его с тем же slug, в БД уходит один раз.
export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
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
})

/**
 * Get all level 1 categories with their children (level 2)
 * For catalog dropdown menu and category pages.
 * Возвращает все разделы верхнего уровня (parentId === null) с подкатегориями.
 */
export async function getCategoriesWithChildren(): Promise<CategoryWithChildren[]> {
  const level1Categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    include: {
      children: {
        orderBy: { name: 'asc' },
        select: { id: true, slug: true, name: true, icon: true },
      },
    },
  })

  return level1Categories
}

/**
 * Раздел каталога для витрины: верхнеуровневая категория с подкатегориями
 * и счётчиками товаров (прямые + всё поддерево).
 */
export interface CatalogSectionView {
  id: string
  slug: string
  name: string
  icon: string | null
  productCount: number
  children: Array<{ id: string; slug: string; name: string; productCount: number }>
}

/**
 * Возвращает разделы каталога для главной витрины: roots с подкатегориями
 * и агрегированными счётчиками (товары раздела = прямые + во всех детях).
 */
export async function getCatalogSections(): Promise<CatalogSectionView[]> {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })

  const roots = categories.filter((c) => c.parentId === null)

  const sections: CatalogSectionView[] = roots.map((root) => {
    const children = categories
      .filter((c) => c.parentId === root.id)
      .map((c) => ({ id: c.id, slug: c.slug, name: c.name, productCount: c._count.products }))
      .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name))

    const childTotal = children.reduce((sum, c) => sum + c.productCount, 0)

    return {
      id: root.id,
      slug: root.slug,
      name: root.name,
      icon: root.icon,
      productCount: root._count.products + childTotal,
      children,
    }
  })

  return sections
    .filter((s) => s.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name))
}

/**
 * Возвращает slug категории и всех её потомков (для фильтрации товаров
 * по разделу: клик по разделу показывает товары всех его подкатегорий).
 */
export async function getCategorySubtreeSlugs(slug: string): Promise<string[]> {
  const root = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  })
  if (!root) return [slug]

  const children = await prisma.category.findMany({
    where: { parentId: root.id },
    select: { slug: true },
  })

  return [root.slug, ...children.map((c) => c.slug)]
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
  // Раздел фильтрует по всему поддереву (раздел + подкатегории)
  const categorySlugs = categorySlug ? await getCategorySubtreeSlugs(categorySlug) : null

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

    if (categorySlugs) {
      conditions.push(Prisma.sql`c.slug IN (${Prisma.join(categorySlugs)})`)
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
  const where = categorySlugs
    ? { products: { some: { category: { slug: { in: categorySlugs } } } } }
    : { products: { some: {} } }

  const manufacturers = await prisma.manufacturer.findMany({
    where,
    include: {
      _count: {
        select: {
          products: categorySlugs
            ? { where: { category: { slug: { in: categorySlugs } } } }
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
