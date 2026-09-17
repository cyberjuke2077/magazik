import { Prisma, type Product } from '@prisma/client'
import { expect, it } from 'vitest'
import { preserveCommercialData, type CommercialProduct } from './catalog-commercial-data'

const source = { id: 'local', manufacturerId: 'brand', mpnNormalized: 'MPN', name: 'Fresh description',
  price: new Prisma.Decimal(100), stockCount: 0 } as Product
const current: CommercialProduct = {
  id: 'production', manufacturer: { slug: 'maker' }, mpnNormalized: 'MPN',
  price: null, priceWholesale: new Prisma.Decimal(80), currency: 'RUB',
  stockCount: 20, inStock: true, minOrder: 5,
}

it('preserves cleared prices and stock by natural identity even if local IDs changed', () => {
  const [merged] = preserveCommercialData([source], [{id:'brand',slug:'maker'}], [current])
  expect(merged).toMatchObject({ id:'local', name:'Fresh description', price:null, stockCount:20, minOrder:5 })
  expect(merged.priceWholesale?.toString()).toBe('80')
})
it('uses source prices for a genuinely new product and does not confuse manufacturers', () => {
  const [merged] = preserveCommercialData([source], [{id:'brand',slug:'other-maker'}], [current])
  expect(merged).toBe(source)
})
