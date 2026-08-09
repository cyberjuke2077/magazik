import { describe, expect, it } from 'vitest'
import type { Product } from '@/lib/queries/products'
import { buildProductJsonLd, serializeJsonLd } from './product-jsonld'

const product: Product = {
  id: 'product-id',
  slug: 'test-product',
  name: 'Test product',
  partNumber: 'TEST-MPN',
  sku: 'TEST-SKU',
  category: 'Test category',
  categorySlug: 'test-category',
  manufacturer: 'Test manufacturer',
  manufacturerSlug: 'test-manufacturer',
  price: 100,
  currency: 'RUB',
  inStock: true,
  stockCount: 50,
  unit: 'шт',
  minOrder: 1,
  description: '',
  package: null,
  lifecycle: null,
  lastEnrichedAt: null,
  createdAt: '2026-08-09T00:00:00.000Z',
  specs: {},
  tags: [],
  images: [],
  datasheets: [],
}

describe('product JSON-LD', () => {
  it('does not publish internal stock status', () => {
    const jsonLd = buildProductJsonLd(product)
    const serialized = JSON.stringify(jsonLd)

    expect(serialized).not.toContain('availability')
    expect(serialized).not.toContain('InStock')
    expect(serialized).not.toContain('PreOrder')
  })

  it('escapes markup in structured data', () => {
    const serialized = serializeJsonLd({ name: '</script><script>alert(1)</script>' })

    expect(serialized).not.toContain('<')
    expect(serialized).toContain('\\u003c/script>')
  })
})
