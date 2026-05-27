/**
 * Compatibility adapter over the unified cart storage (`electromagaz_cart`).
 *
 * Historical context: the catalog used a separate "request list" storage,
 * while the product page used the cart. They were merged into a single
 * `electromagaz_cart` store. This module preserves the request-list API
 * shape so the legacy `/request-list` and `/request-list/submit` flows
 * keep working without changes.
 */

import { type CartItem, type Product } from '@/types'

export interface RequestListItem {
  productId: string
  partNumber: string
  name: string
  manufacturer: string
  quantity: number
  minOrder: number
  price: number | null
}

const CART_KEY = 'electromagaz_cart'

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // ignore quota / privacy errors
  }
}

function toRequestItem(item: CartItem): RequestListItem {
  return {
    productId: item.product.id,
    partNumber: item.product.partNumber,
    name: item.product.name,
    manufacturer: item.product.manufacturer,
    quantity: item.quantity,
    minOrder: item.product.minOrder,
    price: item.product.price > 0 ? item.product.price : null,
  }
}

export function getRequestList(): RequestListItem[] {
  return readCart().map(toRequestItem)
}

/**
 * Legacy add-by-fields API. Builds a minimal Product shim and writes to cart.
 * New code should import `useCart` and call `addItem(product, qty)` instead.
 */
export function addToRequestList(
  item: Omit<RequestListItem, 'quantity'> & { quantity?: number },
): void {
  const items = readCart()
  const existing = items.find((i) => i.product.id === item.productId)
  const quantity = Math.max(item.quantity ?? item.minOrder, item.minOrder)

  if (existing) {
    existing.quantity += quantity
    if (existing.quantity < existing.product.minOrder) {
      existing.quantity = existing.product.minOrder
    }
  } else {
    const productShim = {
      id: item.productId,
      slug: item.productId,
      name: item.name,
      partNumber: item.partNumber,
      category: '',
      categorySlug: '',
      manufacturer: item.manufacturer,
      price: item.price ?? 0,
      currency: 'RUB',
      inStock: true,
      stockCount: 0,
      unit: 'шт',
      minOrder: item.minOrder,
      description: '',
      specs: {},
      images: [],
      featured: false,
      tags: [],
      datasheets: [],
    } as unknown as Product
    items.push({ product: productShim, quantity })
  }

  writeCart(items)
}

export function removeFromRequestList(productId: string): void {
  const items = readCart().filter((i) => i.product.id !== productId)
  writeCart(items)
}

export function updateRequestListQuantity(productId: string, quantity: number): void {
  const items = readCart()
  const item = items.find((i) => i.product.id === productId)
  if (item) {
    item.quantity = Math.max(quantity, item.product.minOrder)
    writeCart(items)
  }
}

export function clearRequestList(): void {
  writeCart([])
}

export function isInRequestList(productId: string): boolean {
  return readCart().some((i) => i.product.id === productId)
}

export function getRequestListCount(): number {
  return readCart().length
}
