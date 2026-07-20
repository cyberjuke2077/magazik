'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Plus, Minus, Check, Zap, Sparkles } from 'lucide-react'
import { useState, useRef } from 'react'
import { type Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { CategoryIcon } from '@/components/ui/component-icons'
import { packageSvgForProduct } from '@/lib/enrichment/images/package-image'
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
  showDiscount?: boolean
}

// Единая тема - azure (30% палитра)
const cardTheme = {
  bg:        'bg-azure-light',
  iconColor: 'text-azure',
}

export function ProductCard({ product, showDiscount = true }: ProductCardProps) {
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

  // Каскад изображения: реальное фото → generic-SVG корпуса → иконка категории
  const packageSvg = packageSvgForProduct({
    package: product.package,
    partNumber: product.partNumber,
    name: product.name,
  })

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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image zone */}
      <div
        className={`relative flex h-[138px] items-center justify-center overflow-hidden sm:h-[156px] ${cardTheme.bg}`}
      >
        <Link
          href={`/product/${product.slug}`}
          className="absolute inset-0 z-10"
          aria-label={product.name}
        />
        {/* Image when available, fallback to package SVG, then category icon */}
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 240px"
            className="z-10 object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : packageSvg ? (
          <Image
            src={packageSvg}
            alt={`${product.name} - корпус`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 240px"
            className="z-10 object-contain p-5 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="relative z-10 icon-svg">
            <CategoryIcon
              slug={product.categorySlug || ''}
              size={72}
              className={`${cardTheme.iconColor} opacity-70`}
            />
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
          {product.featured && (
            <span className="flex items-center gap-1 rounded-sm bg-azure px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              <Zap size={8} />ХИТ
            </span>
          )}
          {isNew && (
            <span className="flex items-center gap-1 rounded-sm bg-stock px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              <Sparkles size={8} />Новинка
            </span>
          )}
          {showDiscount && discountPercent && (
            <span className="rounded-sm bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

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
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">
          {product.manufacturer}
        </div>

        <Link href={`/product/${product.slug}`} className="flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-2 transition-colors hover:text-azure">
            {product.name}
          </h3>
        </Link>

        <div className="mpn w-fit rounded-[var(--radius-control)] bg-[#f8fafc] px-2 py-0.5 text-[11px] text-ink-3">
          {product.partNumber}
        </div>

        {/* Stock + delivery */}
        <div className="flex items-center gap-2 text-[11px]">
          {product.inStock ? (
            <span className="font-semibold text-stock">
              {product.stockCount.toLocaleString('ru-RU')} шт
            </span>
          ) : (
            <span className="font-semibold text-accent">Под заказ</span>
          )}
          <span className="text-ink-4">1-2 недели</span>
        </div>

        {/* Price */}
        <div className="pt-0.5">
          {product.price > 0 ? (
            <div className="flex items-baseline gap-1.5">
              <span className="price text-xl">{formatPrice(product.price)}</span>
              <span className="text-xs text-ink-4">/ {product.unit}</span>
            </div>
          ) : (
            <div className="text-base font-bold text-azure">Уточнить цену</div>
          )}
        </div>

        {/* Stepper + Cart */}
        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.preventDefault()}>
          <div className="flex shrink-0 items-center overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[#f8fafc]">
            <button
              onClick={handleMinus}
              disabled={displayQty <= product.minOrder}
              aria-label="Уменьшить количество"
              className="flex h-9 w-8 items-center justify-center text-ink-3 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <Minus size={12} />
            </button>
            <span className="w-9 select-none border-x border-[var(--border)] text-center text-sm font-bold text-ink tnum">
              {displayQty}
            </span>
            <button
              onClick={handlePlus}
              aria-label="Увеличить количество"
              className="flex h-9 w-8 items-center justify-center text-ink-3 hover:bg-gray-100"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            ref={btnRef}
            onClick={handleAdd}
            aria-label={justAdded ? 'Добавлено в корзину' : inCart ? 'Товар в корзине' : 'Добавить в корзину'}
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] text-xs font-bold transition-all active:scale-[0.97] ${
              justAdded
                ? 'bg-azure-hover text-white'
                : inCart
                ? 'border border-azure/20 bg-azure/10 text-azure'
                : 'bg-azure text-white hover:-translate-y-0.5 hover:bg-azure-hover hover:shadow-md'
            }`}
          >
            {justAdded ? (
              <>
                <Check size={13} />
                <span className="hidden whitespace-nowrap sm:inline">Добавлено!</span>
              </>
            ) : inCart ? (
              <>
                <Check size={13} />
                <span className="hidden whitespace-nowrap sm:inline">В корзине</span>
              </>
            ) : (
              <>
                <ShoppingCart size={13} />
                <span className="hidden whitespace-nowrap sm:inline">В корзину</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
