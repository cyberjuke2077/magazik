import { cartUnitPrice } from '@/lib/cart-pricing'
import { formatPrice } from '@/lib/utils'
import type { CartItem, Product } from '@/types'

export interface CartChange {
  type: 'price' | 'minimum' | 'removed'
  productId: string
  partNumber: string
  message: string
  searchHref?: string
}

export interface CartReconciliation {
  items: CartItem[]
  changes: CartChange[]
}

function unchangedCartItem(current: CartItem, submitted: CartItem): boolean {
  const currentProduct = current.product
  const submittedProduct = submitted.product
  return current.quantity === submitted.quantity
    && currentProduct.id === submittedProduct.id
    && currentProduct.slug === submittedProduct.slug
    && currentProduct.partNumber === submittedProduct.partNumber
    && currentProduct.name === submittedProduct.name
    && currentProduct.manufacturer === submittedProduct.manufacturer
    && currentProduct.price === submittedProduct.price
    && (currentProduct.priceWholesale ?? null) === (submittedProduct.priceWholesale ?? null)
    && currentProduct.currency === submittedProduct.currency
    && currentProduct.inStock === submittedProduct.inStock
    && currentProduct.stockCount === submittedProduct.stockCount
    && currentProduct.minOrder === submittedProduct.minOrder
}

export function preserveCartAfterSubmission(
  currentItems: CartItem[],
  submittedItems: CartItem[],
): CartItem[] {
  const submitted = new Map(submittedItems.map((item) => [item.product.id, item]))
  return currentItems.filter((item) => {
    const previous = submitted.get(item.product.id)
    return !previous || !unchangedCartItem(item, previous)
  })
}

function priceChange(item: CartItem, product: Product, quantity: number): CartChange | null {
  const before = cartUnitPrice(item.product, item.quantity)
  const after = cartUnitPrice(product, quantity)
  if (before === after) return null
  const from = before === null ? 'по запросу' : formatPrice(before)
  const to = after === null ? 'по запросу' : formatPrice(after)
  return {
    type: 'price',
    productId: product.id,
    partNumber: product.partNumber,
    message: `${product.partNumber}: цена за штуку изменилась с ${from} на ${to}.`,
  }
}

function minimumChange(item: CartItem, product: Product, quantity: number): CartChange | null {
  if (item.product.minOrder === product.minOrder) return null
  const adjustment = quantity !== item.quantity ? ` Количество скорректировано до ${quantity}.` : ''
  return {
    type: 'minimum',
    productId: product.id,
    partNumber: product.partNumber,
    message: `${product.partNumber}: минимальная партия изменилась с ${item.product.minOrder} на ${product.minOrder}.${adjustment}`,
  }
}

function removedChange(item: CartItem): CartChange {
  const query = encodeURIComponent(item.product.partNumber)
  return {
    type: 'removed',
    productId: item.product.id,
    partNumber: item.product.partNumber,
    message: `${item.product.partNumber}: товар больше недоступен и удалён из корзины.`,
    searchHref: `/catalog?q=${query}`,
  }
}

export function reconcileCartItems(items: CartItem[], products: Product[]): CartReconciliation {
  const currentById = new Map(products.map((product) => [product.id, product]))
  const nextItems: CartItem[] = []
  const changes: CartChange[] = []

  for (const item of items) {
    const product = currentById.get(item.product.id)
    if (!product) {
      changes.push(removedChange(item))
      continue
    }
    const quantity = Math.max(item.quantity, product.minOrder)
    const price = priceChange(item, product, quantity)
    const minimum = minimumChange(item, product, quantity)
    if (price) changes.push(price)
    if (minimum) changes.push(minimum)
    nextItems.push({ product, quantity })
  }

  return { items: nextItems, changes }
}
