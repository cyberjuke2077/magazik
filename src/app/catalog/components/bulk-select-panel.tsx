'use client'

import { useState, useCallback, createContext, useContext, useRef } from 'react'
import { CheckSquare, Square, X } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import type { Product } from '@/types'

interface BulkSelectContextValue {
  selectedIds: Set<string>
  toggle: (id: string) => void
  addItem: (product: Product, quantity?: number) => Promise<boolean>
  isInCart: (productId: string) => boolean
  getQuantity: (productId: string) => number
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>
}

const BulkSelectContext = createContext<BulkSelectContextValue | null>(null)

export function useBulkSelect() {
  return useContext(BulkSelectContext)
}

interface BulkSelectWrapperProps {
  products: Product[]
  children: React.ReactNode
}

export function BulkSelectWrapper({ products, children }: BulkSelectWrapperProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isAdding, setIsAdding] = useState(false)
  const addingRef = useRef(false)
  const { addItem, isInCart, getQuantity, updateQuantity } = useCart()

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const addAllToRequest = useCallback(async () => {
    if (addingRef.current) return
    addingRef.current = true
    setIsAdding(true)
    const failed = new Set<string>()
    try {
      for (const id of selectedIds) {
        const product = products.find((p) => p.id === id)
        if (!product || !await addItem(product, product.minOrder)) failed.add(id)
      }
      setSelectedIds(failed)
    } finally {
      addingRef.current = false
      setIsAdding(false)
    }
  }, [addItem, selectedIds, products])

  return (
    <BulkSelectContext.Provider value={{
      selectedIds, toggle, addItem, isInCart, getQuantity, updateQuantity,
    }}>
      <div className="relative">
        {/* Product rows (rendered by parent, with context available) */}
        {children}

        {/* Floating bottom panel */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 bg-white border border-[var(--border)] rounded-lg shadow-lg">
            <span className="text-sm font-medium text-ink-2">
              Выбрано {selectedIds.size} товаров
            </span>
            <button
              onClick={() => void addAllToRequest()}
              disabled={isAdding}
              aria-busy={isAdding}
              className="h-8 px-4 text-sm font-bold text-white bg-azure hover:bg-azure-hover transition-colors rounded disabled:cursor-wait disabled:opacity-70"
            >
              {isAdding ? 'Добавляем...' : 'Добавить в корзину'}
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 h-8 px-3 text-sm text-ink-3 hover:text-ink-2 transition-colors"
            >
              <X size={14} />
              Снять выделение
            </button>
          </div>
        )}
      </div>
    </BulkSelectContext.Provider>
  )
}

/**
 * Checkbox to place inside each product row.
 * Must be rendered within a BulkSelectWrapper context.
 */
export function BulkSelectCheckbox({ productId }: { productId: string }) {
  const ctx = useBulkSelect()
  if (!ctx) return null

  const { selectedIds, toggle } = ctx
  const isSelected = selectedIds.has(productId)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(productId)
      }}
      aria-label={isSelected ? 'Снять выделение товара' : 'Выбрать товар'}
      aria-pressed={isSelected}
      className="shrink-0 text-ink-4 hover:text-azure transition-colors"
    >
      {isSelected ? (
        <CheckSquare size={16} className="text-azure" />
      ) : (
        <Square size={16} />
      )}
    </button>
  )
}
