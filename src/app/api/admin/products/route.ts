import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        manufacturer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        partNumber: p.partNumber,
        sku: p.sku,
        category: p.category.name,
        manufacturer: p.manufacturer.name,
        slug: p.slug,
        description: p.description,
        weight: p.weight,
      }))
    )
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
