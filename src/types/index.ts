export interface Product {
  id: string
  slug: string
  name: string
  partNumber: string
  category: string
  categorySlug?: string
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
  createdAt?: string
  images?: string[]
  /** Корпус (например "SOIC-8" или семейство "soic") — для generic-картинки */
  package?: string | null
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

export interface OrderItem {
  product: Product
  quantity: number
  priceAtOrder: number
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  statusLabel: string
  createdAt: string
  updatedAt: string
  shippingAddress?: string
  notes?: string
}

export interface AdminStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  revenueByDay: Array<{ date: string; revenue: number }>
  ordersByStatus: Array<{ status: OrderStatus; count: number }>
  topProducts: Array<{ product: Product; soldCount: number; revenue: number }>
}
