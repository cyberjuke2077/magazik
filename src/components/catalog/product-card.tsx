'use client'

import Link from 'next/link'
import { ShoppingCart, Plus, Minus, Check, Zap, Sparkles } from 'lucide-react'
import { useState, useRef } from 'react'
import { type Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { CategoryIcon } from '@/components/ui/component-icons'
import { CompareToggleBtn } from './compare-toggle-btn'
import { flyToCart } from '@/lib/fly-to-cart'

const NEW_THRESHOLD_DAYS = 14
const NEW_THRESHOLD_MS = NEW_THRESHOLD_DAYS * 24 * 60 * 60 * 1000

function isNewProduct(createdAt?: string): boolean {
  if (!createdAt) return false
  const ts = Date.parse(createdAt)
  if (Number.isNaN(ts)) return false
  return Date.now() - ts < NEW_THRESHOLD_MS
}

interface ProductCardProps {
  product: Product
}

// Единая тема — azure (30% палитра)
const cardTheme = {
  bg:        'bg-[#e8f4ff]',
  iconColor: 'text-[#0066cc]',
  glow:      'hover:shadow-[#0066cc]/10',
}

export function ProductCard({ product }: ProductCardProps) {
  const discountPercent = product.priceWholesale
    ? Math.round((1 - product.priceWholesale / product.price) * 100)
    : null

  const { addItem, isInCart, getQuantity, updateQuantity } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  const inCart = isInCart(product.id)
  const cartQty = getQuantity(product.id)
  const [localQty, setLocalQty] = useState(product.minOrder)
  const displayQty = inCart ? cartQty : localQty
  const btnRef = useRef<HTMLButtonElement>(null)
  const isNew = isNewProduct(product.createdAt)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    addItem(product, localQty)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1800)
    flyToCart(btnRef.current)
  }

  function handleMinus(e: React.MouseEvent) {
    e.preventDefault()
    if (inCart) updateQuantity(product.id, Math.max(product.minOrder, cartQty - 1))
    else setLocalQty((q) => Math.max(product.minOrder, q - 1))
  }

  function handlePlus(e: React.MouseEvent) {
    e.preventDefault()
    if (inCart) updateQuantity(product.id, cartQty + 1)
    else setLocalQty((q) => q + 1)
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col bg-white border border-gray-200 rounded overflow-hidden hover:border-gray-300"
    >
      {/* Image zone */}
      <div
        className={`relative flex items-center justify-center overflow-hidden ${cardTheme.bg}`}
        style={{ height: '180px' }}
      >
        {/* Icon */}
        <div className="relative z-10 icon-svg">
          <CategoryIcon
            slug={product.categorySlug || ''}
            size={72}
            className={`${cardTheme.iconColor} opacity-70`}
          />
        </div>

        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
          {product.featured && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#0066cc] text-white text-[10px] font-bold rounded-sm shadow-sm">
              <Zap size={8} />ХИТ
            </span>
          )}
          {isNew && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#10b981] text-white text-[10px] font-bold rounded-sm shadow-sm">
              <Sparkles size={8} />NEW
            </span>
          )}
          {discountPercent && (
            <span className="px-2 py-0.5 bg-[#f97316] text-white text-[10px] font-bold rounded-sm shadow-sm">
              −{discountPercent}%
            </span>
          )}
        </div>

        {/* No stock badge */}
        {!product.inStock && (
          <div className="absolute top-2.5 right-2.5 z-20">
            <span className="px-2 py-0.5 bg-white/95 text-red-500 text-[10px] font-semibold rounded-sm border border-red-200 shadow-sm">
              Нет
            </span>
          </div>
        )}

        {/* Compare button (bottom-right) */}
        <div className="absolute bottom-2 right-2 z-20 bg-white/90 backdrop-blur-sm rounded">
          <CompareToggleBtn
            item={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              partNumber: product.partNumber,
              manufacturer: product.manufacturer,
              categorySlug: product.categorySlug || '',
            }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          {product.manufacturer}
        </div>

        <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 flex-1">
          {product.name}
        </h3>

        <div className="font-mono text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md w-fit">
          {product.partNumber}
        </div>

        {/* Stock + delivery */}
        <div className="flex items-center gap-2 text-[11px]">
          {product.inStock ? (
            <span className="text-[#0066cc] font-semibold">
              {product.stockCount.toLocaleString('ru-RU')} шт
            </span>
          ) : (
            <span className="text-[#f97316] font-semibold">Под заказ</span>
          )}
          <span className="text-gray-300">·</span>
          <span className="text-gray-400">1–2 недели</span>
        </div>

        {/* Price */}
        <div className="pt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-gray-400">/ {product.unit}</span>
          </div>

        </div>

        {/* Stepper + Cart */}
        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.preventDefault()}>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded overflow-hidden shrink-0">
            <button
              onClick={handleMinus}
              disabled={displayQty <= product.minOrder}
              className="flex items-center justify-center w-8 h-9 text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <Minus size={12} />
            </button>
            <span className="w-9 text-center text-sm font-bold text-gray-900 border-x border-gray-200 select-none">
              {displayQty}
            </span>
            <button
              onClick={handlePlus}
              className="flex items-center justify-center w-8 h-9 text-gray-500 hover:bg-gray-100"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            ref={btnRef}
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold rounded ${
              justAdded
                ? 'bg-[#0052a3] text-white'
                : inCart
                ? 'bg-[#0066cc]/10 text-[#0066cc] border border-[#0066cc]/20'
                : product.inStock
                ? 'bg-[#0066cc] text-white hover:bg-[#0052a3]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <>
                <Check size={13} />Добавлено!
              </>
            ) : inCart ? (
              <>
                <Check size={13} />В корзине
              </>
            ) : (
              <>
                <ShoppingCart size={13} />В корзину
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
