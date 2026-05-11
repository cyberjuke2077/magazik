import { prisma } from '@/lib/prisma'
import { type Product as PrismaProduct, type Category, type Manufacturer } from '@prisma/client'

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
  price: number
  priceWholesale?: number
  currency: string
  inStock: boolean
  stockCount: number
  unit: string
  minOrder: number
  weight?: number
  description: string
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
    price: p.price ? Number(p.price) : 0,
    priceWholesale: p.priceWholesale ? Number(p.priceWholesale) : undefined,
    currency: p.currency,
    inStock: p.inStock,
    stockCount: p.stockCount,
    unit: p.unit,
    minOrder: p.minOrder,
    weight: p.weight ? Number(p.weight) : undefined,
    description: p.description || '',
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
