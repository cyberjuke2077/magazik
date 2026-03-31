'use client'

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
  const isWholesale = product.priceWholesale !== undefined && quantity >= product.minOrder
  const unitPrice = isWholesale ? (product.priceWholesale ?? product.price) : product.price
  const lineTotal = unitPrice * quantity

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 transition-colors ${selected ? 'bg-[#f0f7ff]' : 'hover:bg-gray-50'}`}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(product.id)}
        className="w-4 h-4 rounded border-gray-300 accent-[#0066cc] cursor-pointer flex-shrink-0"
      />

      {/* Photo */}
      <div className="w-14 h-14 flex-shrink-0 border border-gray-200 rounded bg-white flex items-center justify-center overflow-hidden">
          <Package size={22} className="text-gray-300" />
      </div>

      {/* Name + article */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${product.slug}`}
          className="text-sm font-medium text-gray-900 hover:text-[#0066cc] transition-colors line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 font-mono">{product.partNumber}</span>
          {product.manufacturer && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{product.manufacturer}</span>
            </>
          )}
        </div>
        {isWholesale && (
          <span className="inline-block mt-1 text-[10px] text-orange-500 font-medium">оптовая цена</span>
        )}
      </div>

      {/* Unit price */}
      <div className="w-20 text-right flex-shrink-0 hidden sm:block">
        <div className="text-sm text-gray-700">{formatPrice(unitPrice)}</div>
        <div className="text-[10px] text-gray-400">за шт.</div>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center border border-gray-300 rounded overflow-hidden flex-shrink-0">
        <button
          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
          disabled={quantity <= product.minOrder}
          className="w-7 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-gray-300"
        >
          <Minus size={11} />
        </button>
        <span className="w-10 h-8 flex items-center justify-center text-sm font-medium text-gray-900 bg-white">
          {quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
          className="w-7 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors border-l border-gray-300"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Line total */}
      <div className="w-24 text-right flex-shrink-0">
        <div className="text-sm font-semibold text-gray-900">{formatPrice(lineTotal)}</div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(product.id)}
        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Удалить товар"
      >
        <X size={15} />
      </button>
    </div>
  )
}
