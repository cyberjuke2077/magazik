import { isStoredProduct } from '@/lib/cart-storage'
import type { Product } from '@/types'

function readProducts(value: unknown): Product[] | null {
  if (typeof value !== 'object' || value === null || !('products' in value)) return null
  const products = value.products
  if (!Array.isArray(products) || !products.every(isStoredProduct)) return null
  return products
}

export async function fetchCurrentCartProducts(ids: string[]): Promise<Product[]> {
  const response = await fetch('/api/cart/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!response.ok) throw new Error(`Cart refresh failed with ${response.status}`)
  const products = readProducts(await response.json())
  if (!products) throw new Error('Cart refresh returned invalid products')
  return products
}
