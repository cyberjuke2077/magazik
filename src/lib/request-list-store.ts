/**
 * Compatibility adapter over the unified cart storage (`electromagaz_cart`).
 *
 * Historical context: the catalog used a separate "request list" storage,
 * while the product page used the cart. They were merged into a single
 * `electromagaz_cart` store. This module preserves the request-list API
 * shape so the legacy `/request-list` and `/request-list/submit` flows
 * keep working without changes.
 */

import { cartUnitPrice } from '@/lib/cart-pricing'
import { mutateCartItems, normalizeCartQuantity, readCartItems } from '@/lib/cart-storage'
import type { CartItem, Product } from '@/types'

export interface RequestListItem {
  productId: string
  partNumber: string
  name: string
  manufacturer: string
  quantity: number
  minOrder: number
  price: number | null
}

function toRequestItem(item: CartItem): RequestListItem {
  return {
    productId: item.product.id,
    partNumber: item.product.partNumber,
    name: item.product.name,
    manufacturer: item.product.manufacturer,
    quantity: item.quantity,
    minOrder: item.product.minOrder,
    price: cartUnitPrice(item.product, item.quantity),
  }
}

export function getRequestList(): RequestListItem[] {
  return readCartItems().map(toRequestItem)
}

export async function addToRequestList(
  product: Product,
  requestedQuantity = product.minOrder,
): Promise<void> {
  const quantity = normalizeCartQuantity(requestedQuantity, product.minOrder)
  await mutateCartItems((items) => {
    const existing = items.find((item) => item.product.id === product.id)
    if (!existing) return [...items, { product, quantity }]
    return items.map((item) => item.product.id === product.id
      ? { product, quantity: normalizeCartQuantity(item.quantity + quantity, product.minOrder) }
      : item)
  })
}

export async function removeFromRequestList(productId: string): Promise<void> {
  await mutateCartItems((items) => items.filter((item) => item.product.id !== productId))
}

export async function updateRequestListQuantity(productId: string, quantity: number): Promise<void> {
  await mutateCartItems((items) => items.map((item) => item.product.id === productId
    ? { ...item, quantity: normalizeCartQuantity(quantity, item.product.minOrder) }
    : item))
}

export async function clearRequestList(): Promise<void> {
  await mutateCartItems(() => [])
}

export function isInRequestList(productId: string): boolean {
  return readCartItems().some((item) => item.product.id === productId)
}

export function getRequestListCount(): number {
  return readCartItems().length
}
