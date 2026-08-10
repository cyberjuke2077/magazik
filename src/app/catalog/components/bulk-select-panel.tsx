'use client'

import { useState, useCallback, createContext, useContext } from 'react'
import { CheckSquare, Square, X } from 'lucide-react'
import { addToRequestList } from '@/lib/request-list-store'

interface BulkProduct {
  id: string
  partNumber: string
  name: string
  manufacturer: string
  minOrder: number
  price: number | null
}

interface BulkSelectContextValue {
  selectedIds: Set<string>
  toggle: (id: string) => void
}

const BulkSelectContext = createContext<BulkSelectContextValue | null>(null)

export function useBulkSelect() {
  return useContext(BulkSelectContext)
}

interface BulkSelectWrapperProps {
  products: BulkProduct[]
  children: React.ReactNode
}

export function BulkSelectWrapper({ products, children }: BulkSelectWrapperProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  const addAllToRequest = useCallback(() => {
    for (const id of selectedIds) {
      const product = products.find((p) => p.id === id)
      if (product) {
        addToRequestList({
          productId: product.id,
          partNumber: product.partNumber,
          name: product.name,
          manufacturer: product.manufacturer,
          minOrder: product.minOrder,
          price: product.price,
        })
      }
    }
    setSelectedIds(new Set())
  }, [selectedIds, products])

  return (
    <BulkSelectContext.Provider value={{ selectedIds, toggle }}>
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
              onClick={addAllToRequest}
              className="h-8 px-4 text-sm font-bold text-white bg-azure hover:bg-azure-hover transition-colors rounded"
            >
              Добавить в корзину
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
