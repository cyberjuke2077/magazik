import { PrismaClient } from '@prisma/client'
import { expect } from '@playwright/test'

export async function assertVisualFixture(): Promise<void> {
  const host = new URL(process.env.DATABASE_URL ?? 'file:///missing').hostname
  if (process.env.E2E_LOCAL_MVP !== '1' || !['localhost', '127.0.0.1', '[::1]'].includes(host)) {
    throw new Error('Visual baseline requires an isolated local MVP database; run db:seed:local-mvp first')
  }
  const prisma = new PrismaClient()
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' }, select: {
      slug: true, createdAt: true, price: true, priceWholesale: true, minOrder: true, stockCount: true,
    } })
    expect(products.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(),
      price: Number(item.price), priceWholesale: Number(item.priceWholesale),
    })), 'Visual data drift: use a fresh database and db:seed:local-mvp, do not refresh snapshots').toEqual([
      { slug: 'tps5430ddar-local-mvp', createdAt: '2020-01-01T00:00:00.000Z', price: 430, priceWholesale: 385, minOrder: 10, stockCount: 240 },
      { slug: 'stm32f103c8t6-local-mvp', createdAt: '2020-01-02T00:00:00.000Z', price: 560, priceWholesale: 510, minOrder: 5, stockCount: 180 },
      { slug: 'rc0603fr-0710kl-local-mvp', createdAt: '2020-01-03T00:00:00.000Z', price: 1.9, priceWholesale: 1.45, minOrder: 100, stockCount: 25000 },
    ])
    expect(await prisma.category.count()).toBe(3)
    expect(await prisma.manufacturer.count()).toBe(3)
    expect(await prisma.productImage.count()).toBe(0)
  } finally { await prisma.$disconnect() }
}
