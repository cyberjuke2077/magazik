import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get root category "Электронные компоненты"
    const rootCategory = await prisma.category.findUnique({
      where: { slug: 'category-1730' },
    })

    if (!rootCategory) {
      return NextResponse.json({ error: 'Root category not found' }, { status: 404 })
    }

    // Get all Level 1 categories with their Level 2 children
    const level1Categories = await prisma.category.findMany({
      where: { parentId: rootCategory.id },
      include: {
        children: {
          include: {
            _count: {
              select: { products: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Transform to tree structure
    const tree = level1Categories.map((level1) => ({
      id: level1.id,
      name: level1.name,
      slug: level1.slug,
      children: level1.children.map((level2) => ({
        id: level2.id,
        name: level2.name,
        slug: level2.slug,
        productCount: level2._count.products,
      })),
    }))

    return NextResponse.json(tree)
  } catch (error) {
    console.error('Failed to fetch categories tree:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
