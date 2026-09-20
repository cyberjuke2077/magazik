import { describe, expect, it } from 'vitest'
import {
  CART_STORAGE_VERSION,
  CartStorageError,
  MAX_CART_ITEMS,
  parseCartStorage,
  serializeCartStorage,
} from './cart-storage'
import type { Product } from '@/types'

const product: Product = {
  id: 'product-1',
  slug: 'tps5430ddar',
  name: 'Преобразователь TPS5430DDAR',
  partNumber: 'TPS5430DDAR',
  category: 'Микросхемы питания',
  categorySlug: 'power-management',
  manufacturer: 'Texas Instruments',
  price: 430,
  priceWholesale: 385,
  currency: 'RUB',
  inStock: true,
  stockCount: 120,
  unit: 'шт',
  minOrder: 10,
  description: 'Понижающий преобразователь',
  specs: { Корпус: 'SOIC-8' },
  tags: [],
  images: [],
}

describe('cart storage schema', () => {
  it.each(['null', '{}', '{"version":1,"items":{}}'])('recovers from wrong shape: %s', (raw) => {
    expect(parseCartStorage(raw)).toEqual([])
  })

  it('drops an incomplete product instead of crashing the storefront', () => {
    const raw = JSON.stringify({
      version: CART_STORAGE_VERSION,
      items: [{ productId: 'product-1', quantity: 10, snapshot: { id: 'product-1' } }],
    })
    expect(parseCartStorage(raw)).toEqual([])
  })

  it('drops malformed optional fields used by the cart renderer', () => {
    const raw = JSON.stringify([{ product: { ...product, package: {} }, quantity: 10 }])
    expect(parseCartStorage(raw)).toEqual([])
  })

  it('removes forged remote image hosts before next/image can render them', () => {
    const raw = JSON.stringify([{
      product: { ...product, images: ['https://unconfigured.invalid/tracker.png', '/storefront/local.png'] },
      quantity: 10,
    }])
    expect(parseCartStorage(raw)[0].product.images).toEqual(['/storefront/local.png'])
  })

  it('rejects a negative wholesale price', () => {
    const raw = JSON.stringify([{ product: { ...product, priceWholesale: -1 }, quantity: 10 }])
    expect(parseCartStorage(raw)).toEqual([])
  })

  it('rejects unsafe quantities and merges duplicate product rows safely', () => {
    const unsafe = JSON.stringify([{ product, quantity: Number.MAX_SAFE_INTEGER + 1 }])
    expect(parseCartStorage(unsafe)).toEqual([])

    const aboveSubmissionLimit = JSON.stringify([{ product, quantity: 1_000_001 }])
    expect(parseCartStorage(aboveSubmissionLimit)).toEqual([])

    const duplicates = JSON.stringify([
      { product, quantity: 10 },
      { product, quantity: 20 },
    ])
    expect(parseCartStorage(duplicates)).toEqual([{ product, quantity: 30 }])
  })

  it('reads the legacy array and clamps quantity to the stored minimum', () => {
    const raw = JSON.stringify([{ product, quantity: 1 }])
    expect(parseCartStorage(raw)).toEqual([{ product, quantity: 10 }])
  })

  it('writes a versioned payload with identity, quantity and a valid snapshot', () => {
    const raw = serializeCartStorage([{ product, quantity: 20 }])
    expect(JSON.parse(raw)).toMatchObject({
      version: CART_STORAGE_VERSION,
      items: [{
        productId: product.id,
        quantity: 20,
        snapshot: {
          id: product.id,
          slug: product.slug,
          priceWholesale: product.priceWholesale,
          description: '',
          specs: {},
          tags: [],
        },
      }],
    })
    expect(parseCartStorage(raw)).toEqual([{
      product: expect.objectContaining({ id: product.id, slug: product.slug }),
      quantity: 20,
    }])
  })

  it('rejects a 101st position instead of silently truncating the cart', () => {
    const items = Array.from({ length: MAX_CART_ITEMS + 1 }, (_, index) => ({
      product: { ...product, id: `product-${index}`, slug: `product-${index}` },
      quantity: 10,
    }))

    expect(() => serializeCartStorage(items)).toThrow(CartStorageError)
    expect(() => serializeCartStorage(items)).toThrow(`не более ${MAX_CART_ITEMS}`)
  })
})
