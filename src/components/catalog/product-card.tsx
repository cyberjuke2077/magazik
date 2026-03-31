'use client'

import Link from 'next/link'
import { ShoppingCart, Plus, Minus, Check, Zap } from 'lucide-react'
import { useState, useRef } from 'react'
import { type Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { CategoryIcon } from '@/components/ui/component-icons'

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

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (btnRef.current) {
      const btn = btnRef.current
      const rect = btn.getBoundingClientRect()
      const ripple = document.createElement('span')
      const size = Math.max(rect.width, rect.height)
      ripple.style.cssText = `
        position:absolute;width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
        border-radius:50%;background:rgba(255,255,255,0.35);
        animation:ripple 0.6s ease-out forwards;pointer-events:none;
      `
      btn.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    }
    addItem(product, localQty)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1800)
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
      className={`group flex flex-col bg-white border border-gray-100 rounded overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 ${cardTheme.glow}`}
    >
      {/* Image zone */}
      <div
        className={`relative flex items-center justify-center overflow-hidden ${cardTheme.bg}`}
        style={{ aspectRatio: '4/3' }}
      >
        {/* Circuit grid */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            color: 'rgba(0,0,0,0.06)',
          }}
        />

        {/* Icon */}
        <div className="relative z-10 icon-svg">
          <CategoryIcon
            slug={product.categorySlug}
            size={72}
            className={`${cardTheme.iconColor} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
          />
        </div>

        {/* Glow */}
        <div className={`absolute inset-0 ${cardTheme.bg} opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-xl`} />

        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
          {product.featured && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#0066cc] text-white text-[10px] font-bold rounded-sm shadow-sm">
              <Zap size={8} />ХИТ
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
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          {product.manufacturer}
        </div>

        <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#0066cc] transition-colors duration-200 flex-1">
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
              className="flex items-center justify-center w-8 h-9 text-gray-500 hover:bg-gray-100 hover:text-[#0066cc] disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-90"
            >
              <Minus size={12} />
            </button>
            <span className="w-9 text-center text-sm font-bold text-gray-900 border-x border-gray-200 select-none">
              {displayQty}
            </span>
            <button
              onClick={handlePlus}
              className="flex items-center justify-center w-8 h-9 text-gray-500 hover:bg-gray-100 hover:text-[#0066cc] transition-all active:scale-90"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            ref={btnRef}
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`btn-ripple flex-1 flex items-center justify-center gap-1.5 h-9 text-xs font-bold rounded transition-all duration-200 relative overflow-hidden ${
              justAdded
                ? 'bg-[#0052a3] text-white scale-95'
                : inCart
                ? 'bg-[#0066cc]/10 text-[#0066cc] border border-[#0066cc]/20'
                : product.inStock
                ? 'bg-[#0066cc] text-white hover:bg-[#0052a3] active:scale-95 shadow-sm hover:shadow-md hover:shadow-[#0066cc]/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <span className="flex items-center gap-1 animate-bounce-in">
                <Check size={13} />Добавлено!
              </span>
            ) : inCart ? (
              <span className="flex items-center gap-1">
                <Check size={13} />В корзине
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShoppingCart size={13} />В корзину
              </span>
            )}
          </button>
        </div>
      </div>
    </Link>
  )
}
