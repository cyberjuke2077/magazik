'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Minus, Plus, X, Package } from 'lucide-react'
import { type CartItem } from '@/types'
import { formatPrice } from '@/lib/utils'

interface CartItemRowProps {
  item: CartItem
  selected: boolean
  onToggleSelect: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function CartItemRow({
  item,
  selected,
  onToggleSelect,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  const { product, quantity } = item
  const [inputValue, setInputValue] = useState(String(quantity))

  useEffect(() => {
    setInputValue(String(quantity))
  }, [quantity])

  const isWholesale = product.priceWholesale !== undefined && quantity >= product.minOrder
  const unitPrice = isWholesale ? (product.priceWholesale ?? product.price) : product.price
  const lineTotal = unitPrice * quantity

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
  }

  function handleInputBlur() {
    const num = parseInt(inputValue, 10)
    if (!isNaN(num) && num >= product.minOrder) {
      onUpdateQuantity(product.id, num)
    } else {
      setInputValue(String(quantity))
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleInputBlur()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className={`grid grid-cols-[auto_56px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--border)] px-3 py-3 transition-colors last:border-b-0 sm:grid-cols-[auto_64px_minmax(0,1fr)_110px_112px_auto] sm:px-4 ${selected ? 'bg-azure-light' : 'hover:bg-surface-muted'}`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        className="size-4 cursor-pointer rounded border-[var(--border-2)] accent-azure"
      />

      {/* Photo */}
      <div className="flex size-14 items-center justify-center overflow-hidden border border-[var(--border)] bg-white sm:size-16">
        <Package size={24} className="text-ink-4" />
      </div>

      {/* Name + article */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors hover:text-azure"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-ink-4">{product.partNumber}</span>
          {product.manufacturer && (
            <>
              <span className="text-ink-4">·</span>
              <span className="text-xs text-ink-4">{product.manufacturer}</span>
            </>
          )}
        </div>
        {isWholesale && (
          <span className="inline-block mt-1.5 text-xs text-accent font-medium">оптовая цена</span>
        )}
      </div>

      {/* Unit price */}
      {/* Quantity stepper */}
      <div className="col-start-3 row-start-2 flex w-[110px] items-center overflow-hidden rounded border border-[var(--border-2)] sm:col-start-4 sm:row-start-1">
        <button
          onClick={() => {
            const newQty = quantity - 1
            if (newQty >= product.minOrder) onUpdateQuantity(product.id, newQty)
          }}
          disabled={quantity <= product.minOrder}
          className="w-8 h-9 flex items-center justify-center text-ink-3 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-[var(--border-2)]"
        >
          <Minus size={12} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-10 h-9 flex items-center justify-center text-sm font-medium text-ink bg-white text-center outline-none"
        />
        <button
          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
          className="w-8 h-9 flex items-center justify-center text-ink-3 hover:bg-gray-100 transition-colors border-l border-[var(--border-2)]"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Line total */}
      <div className="col-start-4 row-start-2 text-right sm:col-start-5 sm:row-start-1">
        <div className="price text-base">{formatPrice(lineTotal)}</div>
        <div className="text-[11px] text-ink-4">{formatPrice(unitPrice)} / шт.</div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(product.id)}
        className="col-start-4 row-start-1 flex size-8 items-center justify-center text-ink-4 transition-colors hover:text-red-500 sm:col-start-6"
        aria-label="Удалить товар"
      >
        <X size={18} />
      </button>
    </div>
  )
}
