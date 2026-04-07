'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  Trash2,
  Package,
  AlertCircle,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { CartItemRow } from '@/components/ui/cart-item'
import { OrderProgress } from '@/components/ui/order-progress'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { formatPrice } from '@/lib/utils'
import { MIN_ORDER_AMOUNT } from '@/lib/constants'

export default function CartPage() {
  const { items, mounted, totalItems, totalPrice, removeItem, updateQuantity, clearCart } =
    useCart()
  const { user, isVerified } = useAuth()

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
                <span className="text-gray-600">Список запроса</span>
              </nav>
            </div>
          </div>

          <div className="mx-auto max-w-[1400px] px-4 py-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded border border-gray-200 bg-gray-50 mb-6">
              <ShoppingCart size={36} className="text-gray-300" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Список запроса пуст</h1>
            <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
              Добавьте товары в список для формирования запроса на коммерческое предложение.
              Минимальная сумма заказа — 200 000 ₽.
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
              <span className="text-gray-600">Список запроса</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-6">
          {/* Page title */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-gray-900">
              Список запроса
              <span className="ml-2 text-base font-normal text-gray-400">
                ({totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'})
              </span>
            </h1>
            <button
              onClick={clearCart}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={15} />
              Очистить список
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
                <div className="ml-auto hidden md:flex items-center text-sm text-gray-500 font-medium gap-4">
                  <span className="w-5" />
                  <span className="w-20" />
                  <span className="flex-1" />
                  <span className="w-24 text-left">Цена</span>
                  <span className="w-[110px] text-center">Количество</span>
                  <span className="w-28 text-right">Сумма</span>
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
                  className="inline-flex items-center gap-1.5 text-sm text-[#0066cc] hover:text-[#0066cc] transition-colors"
                >
                  ← Продолжить выбор товаров
                </Link>
              </div>
            </div>

            {/* Right: summary */}
            <div className="w-72 flex-shrink-0 sticky top-24">
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                {/* Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">Итого</span>
                </div>

                <div className="px-4 py-4 space-y-3">
                  {/* Order Progress */}
                  <OrderProgress 
                    currentAmount={totalPrice} 
                    minAmount={MIN_ORDER_AMOUNT} 
                  />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Товаров в списке:</span>
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
                      <span className="text-sm text-gray-500">Сумма запроса:</span>
                      <span className="text-lg font-bold text-gray-900">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  {totalPrice < MIN_ORDER_AMOUNT && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-xs text-yellow-800 leading-relaxed">
                        <strong>Минимальная сумма заказа:</strong> {formatPrice(MIN_ORDER_AMOUNT)}
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Мы работаем только с оптовыми заказами от 200 000 ₽
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4">
                  {totalPrice < MIN_ORDER_AMOUNT ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>
                          Добавьте товаров ещё на {formatPrice(MIN_ORDER_AMOUNT - totalPrice)} для отправки запроса
                        </span>
                      </div>
                      <button
                        disabled
                        className="flex items-center justify-center gap-2 w-full h-11 text-sm font-semibold text-gray-400 bg-gray-100 rounded cursor-not-allowed"
                      >
                        Отправить запрос на КП
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : user && !isVerified ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-gray-500" />
                        <span>
                          Для отправки запроса необходимо подтверждение аккаунта
                        </span>
                      </div>
                      <button
                        disabled
                        className="flex items-center justify-center gap-2 w-full h-11 text-sm font-semibold text-gray-400 bg-gray-100 rounded cursor-not-allowed"
                      >
                        Отправить запрос на КП
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/request-quote"
                      className="flex items-center justify-center gap-2 w-full h-11 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
                    >
                      Отправить запрос на КП
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>

                {/* Advantages */}
                <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <Package size={13} className="mt-0.5 flex-shrink-0 text-[#0066cc]" />
                    <span>Работаем с юридическими лицами и ИП</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <Package size={13} className="mt-0.5 flex-shrink-0 text-[#0066cc]" />
                    <span>Минимальный заказ от 200 000 ₽</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500">
                    <Package size={13} className="mt-0.5 flex-shrink-0 text-[#0066cc]" />
                    <span>Ответ на запрос в течение 24 часов</span>
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
