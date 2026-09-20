'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useToast } from '@/components/ui/toast'
import { fetchCurrentCartProducts } from '@/lib/cart-api'
import {
  preserveCartAfterSubmission,
  reconcileCartItems,
  type CartChange,
} from '@/lib/cart-reconciliation'
import { cartSummary } from '@/lib/cart-pricing'
import {
  CART_CHANGES_KEY,
  CART_CHANGES_UPDATED_EVENT,
  CART_KEY,
  CART_UPDATED_EVENT,
  CartStorageError,
  clearPendingCartChanges,
  mutateCartItems,
  normalizeCartQuantity,
  persistPendingCartChanges,
  readCartItems,
  readPendingCartChanges,
  readCartSnapshot,
  withCartLock,
  writeCartItems,
} from '@/lib/cart-storage'
import type { CartItem, Product } from '@/types'

interface UseCartOptions {
  refreshProducts?: boolean
}

export interface CartRefreshResult {
  ok: boolean
  items: CartItem[]
  changes: CartChange[]
}

function addProduct(items: CartItem[], product: Product, quantity: number): CartItem[] {
  const existing = items.find((item) => item.product.id === product.id)
  if (!existing) {
    return [...items, { product, quantity: normalizeCartQuantity(quantity, product.minOrder) }]
  }
  return items.map((item) => item.product.id === product.id
    ? { product, quantity: normalizeCartQuantity(item.quantity + quantity, product.minOrder) }
    : item)
}

function updateProductQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  return items.map((item) => item.product.id === productId
    ? { ...item, quantity: normalizeCartQuantity(quantity, item.product.minOrder) }
    : item)
}

function cartErrorMessage(error: unknown): string {
  return error instanceof CartStorageError
    ? error.message
    : 'Не удалось сохранить корзину. Повторите действие'
}

function useStoredCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const syncCart = () => setItems(readCartItems())
    const syncExternalCart = (event: StorageEvent) => {
      if (event.key === CART_KEY) syncCart()
    }
    syncCart()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    window.addEventListener(CART_UPDATED_EVENT, syncCart)
    window.addEventListener('storage', syncExternalCart)
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart)
      window.removeEventListener('storage', syncExternalCart)
    }
  }, [])
  return { items, setItems, mounted }
}

async function refreshStoredCart(
  setItems: Dispatch<SetStateAction<CartItem[]>>,
  setChanges: Dispatch<SetStateAction<CartChange[]>>,
  setRefreshError: Dispatch<SetStateAction<string | null>>,
  setIsRefreshing: Dispatch<SetStateAction<boolean>>,
): Promise<CartRefreshResult> {
  setRefreshError(null)
  setIsRefreshing(true)
  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const stored = readCartSnapshot().items
      if (stored.length === 0) {
        const empty = await withCartLock(() => {
          if (readCartItems().length > 0) return null
          return { ok: true as const, items: [], changes: readPendingCartChanges() }
        })
        if (!empty) continue
        setItems(empty.items)
        setChanges(empty.changes)
        return empty
      }
      const requestedIds = new Set(stored.map((item) => item.product.id))
      const products = await fetchCurrentCartProducts([...requestedIds])
      const applied = await withCartLock(() => {
        const current = readCartSnapshot()
        if (current.items.some((item) => !requestedIds.has(item.product.id))) return null
        const result = reconcileCartItems(current.items, products)
        if (readCartSnapshot().raw !== current.raw) return null
        const changes = result.changes.length > 0
          ? persistPendingCartChanges(result.changes)
          : readPendingCartChanges()
        writeCartItems(result.items)
        return { ok: true as const, items: result.items, changes }
      })
      if (!applied) continue
      setItems(applied.items)
      setChanges(applied.changes)
      return applied
    }
    throw new Error('Cart changed repeatedly during refresh')
  } catch (error) {
    const message = error instanceof CartStorageError
      ? error.message
      : 'Не удалось проверить актуальные цены и партии. Повторите обновление.'
    const current = readCartItems()
    setItems(current)
    const pendingChanges = readPendingCartChanges()
    setChanges(pendingChanges)
    setRefreshError(message)
    return { ok: false, items: current, changes: pendingChanges }
  } finally {
    setIsRefreshing(false)
  }
}

function useCartRefresh(
  enabled: boolean,
  mounted: boolean,
  setItems: Dispatch<SetStateAction<CartItem[]>>,
) {
  const [changes, setChanges] = useState<CartChange[]>([])
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(enabled)
  const inFlight = useRef<Promise<CartRefreshResult> | null>(null)
  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current
    const request = refreshStoredCart(setItems, setChanges, setRefreshError, setIsRefreshing)
    inFlight.current = request
    void request.finally(() => {
      if (inFlight.current === request) inFlight.current = null
    })
    return request
  }, [setItems])

  useEffect(() => {
    if (!mounted || !enabled) return
    const timer = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(timer)
  }, [enabled, mounted, refresh])

  useEffect(() => {
    if (!mounted || !enabled) return
    const refreshExternalCart = (event: StorageEvent) => {
      if (event.key === CART_KEY && (!event.storageArea || event.storageArea === window.localStorage)) {
        void refresh()
      }
    }
    window.addEventListener('storage', refreshExternalCart)
    return () => window.removeEventListener('storage', refreshExternalCart)
  }, [enabled, mounted, refresh])

  useEffect(() => {
    if (!mounted || !enabled) return
    const syncChanges = () => setChanges(readPendingCartChanges())
    const syncExternalChanges = (event: StorageEvent) => {
      if (event.key === CART_CHANGES_KEY) syncChanges()
    }
    window.addEventListener(CART_CHANGES_UPDATED_EVENT, syncChanges)
    window.addEventListener('storage', syncExternalChanges)
    return () => {
      window.removeEventListener(CART_CHANGES_UPDATED_EVENT, syncChanges)
      window.removeEventListener('storage', syncExternalChanges)
    }
  }, [enabled, mounted])

  const dismissChanges = useCallback(() => {
    try {
      clearPendingCartChanges()
      setChanges([])
    } catch (error) {
      setRefreshError(cartErrorMessage(error))
    }
  }, [])
  const resetStatus = useCallback(() => {
    try {
      clearPendingCartChanges()
      setChanges([])
      setRefreshError(null)
    } catch (error) {
      setRefreshError(cartErrorMessage(error))
    }
    setIsRefreshing(false)
  }, [])
  return { changes, refreshError, isRefreshing, refresh, dismissChanges, resetStatus }
}

function useCartMutations(
  setItems: Dispatch<SetStateAction<CartItem[]>>,
  resetStatus: () => void,
) {
  const { toast } = useToast()
  const pendingAdds = useRef(new Set<string>())
  const commit = useCallback(async (update: (items: CartItem[]) => CartItem[]) => {
    try {
      const next = await mutateCartItems(update)
      setItems(next)
      if (next.length === 0) resetStatus()
      return true
    } catch (error) {
      toast(cartErrorMessage(error), { variant: 'error' })
      return false
    }
  }, [resetStatus, setItems, toast])

  const addItem = useCallback(async (product: Product, quantity = 1) => {
    if (pendingAdds.current.has(product.id)) return false
    pendingAdds.current.add(product.id)
    try {
      return await commit((items) => addProduct(items, product, quantity))
    } finally {
      pendingAdds.current.delete(product.id)
    }
  }, [commit])

  const removeItem = useCallback((productId: string) => (
    commit((items) => items.filter((item) => item.product.id !== productId))
  ), [commit])

  const updateQuantity = useCallback((productId: string, quantity: number) => (
    commit((items) => updateProductQuantity(items, productId, quantity))
  ), [commit])

  const clearCart = useCallback(() => commit(() => []), [commit])

  const removeSubmittedItems = useCallback((submittedItems: CartItem[]) => (
    commit((items) => preserveCartAfterSubmission(items, submittedItems))
  ), [commit])

  return { addItem, removeItem, updateQuantity, clearCart, removeSubmittedItems }
}

export function useCart({ refreshProducts = false }: UseCartOptions = {}) {
  const { items, setItems, mounted } = useStoredCart()
  const refreshState = useCartRefresh(refreshProducts, mounted, setItems)
  const mutations = useCartMutations(setItems, refreshState.resetStatus)

  const isInCart = (productId: string) => items.some((item) => item.product.id === productId)
  const getQuantity = (productId: string) => (
    items.find((item) => item.product.id === productId)?.quantity ?? 0
  )
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const { total: totalPrice, unpriced: unpricedItems } = cartSummary(items)

  return {
    items, mounted, totalItems, totalPrice, unpricedItems, totalWholesale: totalPrice,
    ...refreshState, ...mutations, isInCart, getQuantity,
  }
}
