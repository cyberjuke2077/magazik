import { describe, expect, it } from 'vitest'
import { preserveCartAfterSubmission, reconcileCartItems } from './cart-reconciliation'
import type { Product } from '@/types'

const stored: Product = {
  id: 'product-1', slug: 'old-slug', name: 'TPS5430', partNumber: 'TPS5430DDAR',
  category: 'Микросхемы', categorySlug: 'ics', manufacturer: 'Texas Instruments',
  price: 430, priceWholesale: 385, currency: 'RUB', inStock: true, stockCount: 5,
  unit: 'шт', minOrder: 10, description: '', specs: {}, tags: [], images: [],
}

describe('cart reconciliation', () => {
  it('replaces the snapshot, adjusts the minimum and reports the effective price', () => {
    const current = { ...stored, slug: 'current-slug', price: 860, priceWholesale: 700, minOrder: 30 }
    const result = reconcileCartItems([{ product: stored, quantity: 20 }], [current])

    expect(result.items).toEqual([{ product: current, quantity: 30 }])
    expect(result.changes.map((change) => change.type)).toEqual(['price', 'minimum'])
    expect(result.changes[0].message).toContain('385')
    expect(result.changes[0].message).toContain('700')
    expect(result.changes[1].message).toContain('скорректировано до 30')
  })

  it('removes a missing product and gives the buyer a recovery search link', () => {
    const result = reconcileCartItems([{ product: stored, quantity: 10 }], [])
    expect(result.items).toEqual([])
    expect(result.changes).toEqual([expect.objectContaining({
      type: 'removed',
      partNumber: 'TPS5430DDAR',
      searchHref: '/catalog?q=TPS5430DDAR',
    })])
  })

  it('removes only unchanged submitted rows and preserves concurrent cart changes', () => {
    const submitted = [{ product: stored, quantity: 10 }]
    const added = { ...stored, id: 'product-2', slug: 'product-2', partNumber: 'NEW-2' }

    expect(preserveCartAfterSubmission([
      { product: { ...stored, price: 500 }, quantity: 10 },
      { product: added, quantity: 20 },
    ], submitted)).toEqual([
      { product: { ...stored, price: 500 }, quantity: 10 },
      { product: added, quantity: 20 },
    ])
    expect(preserveCartAfterSubmission(submitted, submitted)).toEqual([])
  })

  it('removes a submitted row when storage kept a compact product snapshot', () => {
    const submittedProduct = {
      ...stored,
      sku: 'SKU-1',
      manufacturerSlug: 'texas-instruments',
      lifecycle: 'active',
      datasheets: [{ id: 'datasheet-1', title: 'Datasheet', url: 'https://example.invalid' }],
    }

    expect(preserveCartAfterSubmission(
      [{ product: stored, quantity: 10 }],
      [{ product: submittedProduct, quantity: 10 }],
    )).toEqual([])
  })
})
