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

  const allSelected = products.length > 0 && selectedIds.size === products.length

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

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
    }
  }, [allSelected, products])

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
        {/* Select all header row */}
        <div className="hidden h-[40px] items-center gap-4 border-b border-[var(--border)] bg-gray-50 px-4 text-xs font-semibold uppercase tracking-wide text-ink-3 sm:flex">
          <button
            onClick={toggleAll}
            className="shrink-0 text-ink-4 hover:text-azure transition-colors"
            title={allSelected ? 'Снять выделение' : 'Выбрать все на странице'}
          >
            {allSelected ? (
              <CheckSquare size={16} className="text-azure" />
            ) : (
              <Square size={16} />
            )}
          </button>
          <div className="w-[140px] shrink-0">Артикул</div>
          <div className="flex-1 min-w-0">Наименование</div>
          <div className="w-[140px] shrink-0 hidden md:block">Производитель</div>
          <div className="w-[30px] shrink-0 hidden lg:block" />
          <div className="w-[70px] shrink-0 hidden lg:block">Срок</div>
          <div className="w-[130px] shrink-0 text-right">Цена</div>
          <div className="w-[180px] shrink-0" />
        </div>

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
