import type { Prisma, Product } from '@prisma/client'

export const commercialSelect = {
  id: true, mpnNormalized: true, manufacturer: { select: { slug: true } },
  price: true, priceWholesale: true, currency: true,
  stockCount: true, inStock: true, minOrder: true,
} satisfies Prisma.ProductSelect

export type CommercialProduct = Prisma.ProductGetPayload<{ select: typeof commercialSelect }>

/** Production owns commercial terms for existing products, including cleared prices. */
export function preserveCommercialData(
  products: Product[],
  manufacturers: Array<{ id: string; slug: string }>,
  current: CommercialProduct[],
): Product[] {
  const byId = new Map(current.map((product) => [product.id, product]))
  const byIdentity = new Map(current.map((product) => [
    `${product.manufacturer.slug}\0${product.mpnNormalized}`, product,
  ]))
  const brands = new Map(manufacturers.map((manufacturer) => [manufacturer.id, manufacturer.slug]))
  return products.map((product) => {
    const existing = byId.get(product.id) ?? byIdentity.get(`${brands.get(product.manufacturerId)}\0${product.mpnNormalized}`)
    if (!existing) return product
    const { price, priceWholesale, currency, stockCount, inStock, minOrder } = existing
    return { ...product, price, priceWholesale, currency, stockCount, inStock, minOrder }
  })
}
