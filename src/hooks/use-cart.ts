'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Product, type CartItem } from '@/types'

const CART_KEY = 'electromagaz_cart'
const CART_UPDATED_EVENT = 'electromagaz:cart-updated'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
    queueMicrotask(() => window.dispatchEvent(new Event(CART_UPDATED_EVENT)))
  } catch (error) {
    console.error('[cart] Failed to save cart:', error)
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const syncCart = () => setItems(loadCart())

    // hydration from localStorage - required after mount
    syncCart()
    // Hydration readiness is intentionally established after the client reads localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    window.addEventListener(CART_UPDATED_EVENT, syncCart)
    window.addEventListener('storage', syncCart)

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart)
      window.removeEventListener('storage', syncCart)
    }
  }, [])

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      let next: CartItem[]
      if (existing) {
        next = prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        )
      } else {
        next = [...prev, { product, quantity: Math.max(quantity, product.minOrder) }]
      }
      saveCart(next)
      return next
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.product.id !== productId)
      saveCart(next)
      return next
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const next = prev.map((i) => {
        if (i.product.id !== productId) return i
        const min = i.product.minOrder
        return { ...i, quantity: Math.max(min, quantity) }
      })
      saveCart(next)
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    saveCart([])
    setItems([])
  }, [])

  const isInCart = useCallback(
    (productId: string) => items.some((i) => i.product.id === productId),
    [items],
  )

  const getQuantity = useCallback(
    (productId: string) => items.find((i) => i.product.id === productId)?.quantity ?? 0,
    [items],
  )

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  const totalPrice = items.reduce((sum, i) => {
    const isWholesale = i.product.priceWholesale !== undefined && i.quantity >= i.product.minOrder
    const price = isWholesale ? (i.product.priceWholesale ?? i.product.price) : i.product.price
    return sum + price * i.quantity
  }, 0)

  const totalWholesale = items.reduce(
    (sum, i) => sum + (i.product.priceWholesale ?? i.product.price) * i.quantity,
    0,
  )

  return {
    items,
    mounted,
    totalItems,
    totalPrice,
    totalWholesale,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getQuantity,
  }
}
