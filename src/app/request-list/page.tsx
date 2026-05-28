'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight, AlertCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import {
  getRequestList,
  removeFromRequestList,
  updateRequestListQuantity,
  clearRequestList,
  type RequestListItem,
} from '@/lib/request-list-store'
import { formatPrice } from '@/lib/catalog-utils'

export default function RequestListPage() {
  const router = useRouter()
  const [items, setItems] = useState<RequestListItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    // hydration from localStorage — required after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getRequestList())
    setMounted(true)
  }, [])

  function handleQuantityChange(productId: string, delta: number) {
    const item = items.find((i) => i.productId === productId)
    if (!item) return
    const newQty = item.quantity + delta
    updateRequestListQuantity(productId, newQty)
    setItems(getRequestList())
  }

  function handleRemove(productId: string) {
    removeFromRequestList(productId)
    setItems(getRequestList())
  }

  function handleClear() {
    clearRequestList()
    setItems([])
    setShowClearConfirm(false)
  }

  // Skeleton while hydrating
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <StickyNav />
        <main className="flex-1 bg-gray-50 py-8">
          <div className="mx-auto max-w-4xl px-4">
            <div className="h-8 w-64 bg-gray-200 rounded mb-6 animate-pulse" />
            <div className="bg-white rounded-lg p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <StickyNav />
        <main className="flex-1 bg-gray-50 py-20">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <ShoppingCart size={32} className="text-gray-300" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Список запроса пуст
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Добавьте товары из каталога для формирования запроса на коммерческое предложение.
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 h-10 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
              >
                Перейти в каталог
              </Link>
            </div>
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

      <main className="flex-1 bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Список запроса</h1>
              <p className="text-sm text-gray-500 mt-1">
                {items.length} {items.length === 1 ? 'позиция' : items.length < 5 ? 'позиции' : 'позиций'}
              </p>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Очистить список
            </button>
          </div>

          {/* Clear confirmation */}
          {showClearConfirm && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-sm text-red-800">Удалить все товары из списка?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="h-8 px-3 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleClear}
                  className="h-8 px-3 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          )}

          {/* Items table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_120px_40px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Товар</span>
              <span className="text-center">Количество</span>
              <span className="text-right">Цена</span>
              <span />
            </div>

            {/* Items */}
            {items.map((item) => (
              <div
                key={item.productId}
                className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_40px] gap-2 sm:gap-4 px-4 py-3 border-b border-gray-100 last:border-0 items-center"
              >
                {/* Product info */}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.partNumber} · {item.manufacturer}
                  </div>
                </div>

                {/* Quantity stepper */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => handleQuantityChange(item.productId, -1)}
                    disabled={item.quantity <= item.minOrder}
                    className="flex items-center justify-center w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.productId, 1)}
                    className="flex items-center justify-center w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Price */}
                <div className="text-right text-sm font-medium text-gray-900">
                  {formatPrice(item.price)}
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Удалить"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/catalog"
              className="text-sm text-[#0066cc] hover:underline font-medium"
            >
              ← Продолжить выбор товаров
            </Link>
            <button
              onClick={() => router.push('/request-list/submit')}
              className="flex items-center gap-2 h-11 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
            >
              Оформить запрос
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
