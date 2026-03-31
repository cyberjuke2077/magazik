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
    <div className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 transition-colors ${selected ? 'bg-[#f0f7ff]' : 'hover:bg-gray-50'}`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        className="w-5 h-5 rounded border-gray-300 accent-[#0066cc] cursor-pointer flex-shrink-0"
      />

      {/* Photo */}
      <div className="w-20 h-20 flex-shrink-0 border border-gray-200 rounded bg-white flex items-center justify-center overflow-hidden">
        <Package size={28} className="text-gray-300" />
      </div>

      {/* Name + article */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${product.slug}`}
          className="text-base font-medium text-gray-900 hover:text-[#0066cc] transition-colors line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-400 font-mono">{product.partNumber}</span>
          {product.manufacturer && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-400">{product.manufacturer}</span>
            </>
          )}
        </div>
        {isWholesale && (
          <span className="inline-block mt-1.5 text-xs text-orange-500 font-medium">оптовая цена</span>
        )}
      </div>

      {/* Unit price */}
      <div className="w-24 text-right flex-shrink-0 hidden md:block pr-4">
        <div className="text-base text-gray-700">{formatPrice(unitPrice)}</div>
        <div className="text-xs text-gray-400">за шт.</div>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center border border-gray-300 rounded overflow-hidden flex-shrink-0 w-[110px]">
        <button
          onClick={() => {
            const newQty = quantity - 1
            if (newQty >= product.minOrder) onUpdateQuantity(product.id, newQty)
          }}
          disabled={quantity <= product.minOrder}
          className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-gray-300"
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
          className="w-10 h-9 flex items-center justify-center text-sm font-medium text-gray-900 bg-white text-center outline-none"
        />
        <button
          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
          className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors border-l border-gray-300"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Line total */}
      <div className="w-28 text-right flex-shrink-0 hidden md:block pl-4">
        <div className="text-lg font-bold text-gray-900">{formatPrice(lineTotal)}</div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(product.id)}
        className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Удалить товар"
      >
        <X size={18} />
      </button>
    </div>
  )
}
