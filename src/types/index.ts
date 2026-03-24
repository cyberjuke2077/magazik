export interface Product {
  id: string
  slug: string
  name: string
  partNumber: string
  category: string
  categorySlug: string
  manufacturer: string
  price: number
  priceWholesale?: number
  currency: string
  inStock: boolean
  stockCount: number
  unit: string
  minOrder: number
  description: string
  specs: Record<string, string>
  tags: string[]
  featured?: boolean
}

export interface Category {
  id: string
  slug: string
  name: string
  icon: string
  count: number
  description: string
  color: string
}

export interface CartItem {
  product: Product
  quantity: number
}
