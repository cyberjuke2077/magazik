'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  Trash2,
  Package,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { CartItemRow } from '@/components/ui/cart-item'
import { useCart } from '@/hooks/use-cart'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { items, mounted, totalItems, totalPrice, removeItem, updateQuantity, clearCart } =
    useCart()

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected = items.length > 0 && selected.size === items.length

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((i) => i.product.id)))
    }
  }

  function toggleSelect(productId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  function deleteSelected() {
    selected.forEach((id) => removeItem(id))
    setSelected(new Set())
  }

  const selectedTotal = useMemo(() => {
    return items
      .filter((i) => selected.has(i.product.id))
      .reduce((sum, i) => {
        const isWholesale = i.product.priceWholesale !== undefined && i.quantity >= i.product.minOrder
        const price = isWholesale ? (i.product.priceWholesale ?? i.product.price) : i.product.price
        return sum + price * i.quantity
      }, 0)
  }, [items, selected])

  // Skeleton while hydrating
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <StickyNav />
        <main>
          <div className="mx-auto max-w-[1400px] px-4 py-6">
            <div className="h-5 w-40 skeleton rounded mb-5" />
            <div className="border border-gray-200 rounded">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[72px] border-b border-gray-100 skeleton" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <StickyNav />
        <main>
          {/* Breadcrumb */}
          <div className="border-b border-gray-100">
            <div className="mx-auto max-w-[1400px] px-4 py-2.5">
              <nav className="flex items-center gap-1.5 text-xs text-gray-400">
                <Link href="/" className="hover:text-gray-600 transition-colors">Главная</Link>
                <ChevronRight size={10} />
                <span className="text-gray-600">Корзина</span>
              </nav>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] px-4 py-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded border border-gray-200 bg-gray-50 mb-6">
              <ShoppingCart size={36} className="text-gray-300" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Корзина пуста</h1>
            <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
              Для выбора используйте каталог товаров или поиск.
              Чтобы добавить товар в корзину, нажмите кнопку «В корзину».
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 h-10 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
            >
              Перейти в каталог
              <ArrowRight size={14} />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-gray-100">
          <div className="mx-auto max-w-[1400px] px-4 py-2.5">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400">
              <Link href="/" className="hover:text-gray-600 transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-gray-600">Корзина</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-6">
          {/* Page title */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-gray-900">
              Корзина
              <span className="ml-2 text-base font-normal text-gray-400">
                ({totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'})
              </span>
            </h1>
            <button
              onClick={clearCart}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={15} />
              Очистить корзину
            </button>
          </div>

          <div className="flex gap-6 items-start">
            {/* Left: items list */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center gap-5 px-5 py-3 bg-gray-50 border border-gray-200 rounded-t text-base">
                <label className="flex items-center gap-3 cursor-pointer select-none text-gray-600 hover:text-gray-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-gray-300 accent-[#0066cc]"
                  />
                  Выбрать все
                </label>

                {selected.size > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors ml-2"
                  >
                    <Trash2 size={14} />
                    Удалить выбранные ({selected.size})
                  </button>
                )}

                {/* Column headers */}
                <div className="ml-auto hidden md:flex items-center text-sm text-gray-500 font-medium">
                  <span className="w-20 -mr-10" />
                  <span className="flex-1" />
                  <span className="w-24 text-left">Цена</span>
                  <span className="w-[110px] text-center">Количество</span>
                  <span className="w-28 text-right pl-4">Сумма</span>
                  <span className="w-9" />
                </div>
              </div>

              {/* Items */}
              <div className="border-x border-b border-gray-200 rounded-b overflow-hidden">
                {items.map((item) => (
                  <CartItemRow
                    key={item.product.id}
                    item={item}
                    selected={selected.has(item.product.id)}
                    onToggleSelect={toggleSelect}
                    onUpdateQuantity={updateQuantity}
                    onRemove={(id) => {
                      removeItem(id)
                      setSelected((prev) => {
                        const next = new Set(prev)
                        next.delete(id)
                        return next
                      })
                    }}
                  />
                ))}
              </div>

              {/* Continue shopping */}
              <div className="mt-4">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 text-sm text-[#0066cc] hover:text-[#0052a3] transition-colors"
                >
                  ← Продолжить покупки
                </Link>
              </div>
            </div>

            {/* Right: summary */}
            <div className="w-72 flex-shrink-0 sticky top-24">
              <div className="border border-gray-200 rounded overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">Итого</span>
                </div>

                <div className="px-4 py-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Товаров в корзине:</span>
                    <span className="font-medium text-gray-900">{totalItems} шт.</span>
                  </div>

                  {selected.size > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Выбрано:</span>
                      <span className="font-medium text-gray-900">{formatPrice(selectedTotal)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Сумма заказа:</span>
                      <span className="text-lg font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    Стоимость доставки рассчитывается при оформлении заказа
                  </p>
                </div>

                <div className="px-4 pb-4">
                  <Link
                    href="/checkout"
                    className="flex items-center justify-center gap-2 w-full h-11 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
                  >
                    Оформить заказ
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Advantages */}
                <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <Package size={13} className="mt-0.5 flex-shrink-0 text-[#0066cc]" />
                    <span>Доставка по всей России</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <Package size={13} className="mt-0.5 flex-shrink-0 text-[#0066cc]" />
                    <span>Оптовые цены от 10 шт.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
