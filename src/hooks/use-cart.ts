'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Product, type CartItem } from '@/types'

const CART_KEY = 'electromagaz_cart'

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
  } catch {
    // ignore storage errors
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(loadCart())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) saveCart(items)
  }, [items, mounted])

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        )
      }
      return [...prev, { product, quantity: Math.max(quantity, product.minOrder) }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i
        const min = i.product.minOrder
        return { ...i, quantity: Math.max(min, quantity) }
      }),
    )
  }, [])

  const clearCart = useCallback(() => {
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

  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

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
