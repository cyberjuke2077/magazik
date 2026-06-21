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
    <div className={`flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] transition-colors ${selected ? 'bg-azure-light' : 'hover:bg-[#fafafa]'}`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        className="w-5 h-5 rounded border-[var(--border-2)] accent-azure cursor-pointer flex-shrink-0"
      />

      {/* Photo */}
      <div className="w-20 h-20 flex-shrink-0 border border-[var(--border)] rounded bg-white flex items-center justify-center overflow-hidden">
        <Package size={28} className="text-ink-4" />
      </div>

      {/* Name + article */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${product.slug}`}
          className="text-base font-medium text-ink hover:text-azure transition-colors line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-ink-4 font-mono">{product.partNumber}</span>
          {product.manufacturer && (
            <>
              <span className="text-ink-4">·</span>
              <span className="text-sm text-ink-4">{product.manufacturer}</span>
            </>
          )}
        </div>
        {isWholesale && (
          <span className="inline-block mt-1.5 text-xs text-accent font-medium">оптовая цена</span>
        )}
      </div>

      {/* Unit price */}
      <div className="w-24 text-left flex-shrink-0 hidden md:block">
        <div className="price text-base font-semibold">{formatPrice(unitPrice)}</div>
        <div className="text-xs text-ink-4">за шт.</div>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center border border-[var(--border-2)] rounded overflow-hidden flex-shrink-0 w-[110px]">
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
      <div className="w-28 text-right flex-shrink-0 hidden md:block pl-4">
        <div className="price text-lg">{formatPrice(lineTotal)}</div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(product.id)}
        className="w-9 h-9 flex items-center justify-center text-ink-4 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Удалить товар"
      >
        <X size={18} />
      </button>
    </div>
  )
}
