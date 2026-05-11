import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const manufacturers = await prisma.manufacturer.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(
      manufacturers.map(m => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        description: m.description,
        website: m.website,
        productCount: m._count.products,
      }))
    )
  } catch (error) {
    console.error('Failed to fetch manufacturers:', error)
    return NextResponse.json({ error: 'Failed to fetch manufacturers' }, { status: 500 })
  }
}
