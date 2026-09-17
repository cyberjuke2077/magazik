import type { CartItem, Product } from '@/types'

export function cartUnitPrice(product: Product, quantity: number): number | null {
  const wholesale = product.priceWholesale
  const price = wholesale != null && wholesale > 0 && quantity >= product.minOrder
    ? wholesale : product.price
  return Number.isFinite(price) && price > 0 ? price : null
}

export function cartSummary(items: CartItem[]) {
  return items.reduce((summary, item) => {
    const price = cartUnitPrice(item.product, item.quantity)
    if (price === null) summary.unpriced++
    else summary.total += Math.round(price * 100) * item.quantity / 100
    return summary
  }, { total: 0, unpriced: 0 })
}
