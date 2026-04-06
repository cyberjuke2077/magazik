'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Trash2, ShoppingCart, Package } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/hooks/use-auth'

// Mock history data
const mockHistory = [
  {
    id: '1',
    name: 'Микроконтроллер ATmega328P-PU',
    article: 'ATMEGA328P',
    price: 450,
    viewedAt: '2 часа назад',
    category: 'Микроконтроллеры',
  },
  {
    id: '2',
    name: 'Реле электромагнитное 12В 10А',
    article: 'RELAY-12V-10A',
    price: 85,
    viewedAt: '5 часов назад',
    category: 'Реле',
  },
  {
    id: '3',
    name: 'Транзистор биполярный BC547',
    article: 'BC547',
    price: 6,
    viewedAt: 'Вчера',
    category: 'Транзисторы',
  },
  {
    id: '4',
    name: 'Стабилизатор напряжения LM7805',
    article: 'LM7805',
    price: 25,
    viewedAt: 'Вчера',
    category: 'Стабилизаторы',
  },
  {
    id: '5',
    name: 'Операционный усилитель LM358',
    article: 'LM358',
    price: 18,
    viewedAt: '2 дня назад',
    category: 'Микросхемы',
  },
]

export default function HistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState(mockHistory)

  if (!user) {
    return (
      <>
        <Header />
        <StickyNav />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Войдите в аккаунт</h2>
              <p className="text-gray-500 mb-4">Чтобы увидеть историю просмотров</p>
              <Link
                href="/account"
                className="inline-block px-6 py-2.5 bg-[#0066cc] text-white rounded hover:bg-[#0052a3] transition-colors"
              >
                Войти
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const clearHistory = () => {
    setHistory([])
  }

  const removeItem = (id: string) => {
    setHistory(history.filter(item => item.id !== id))
  }

  return (
    <>
      <Header />
      <StickyNav />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-[1400px] px-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-[#0066cc]">Главная</Link>
            <span>/</span>
            <Link href="/account" className="hover:text-[#0066cc]">Личный кабинет</Link>
            <span>/</span>
            <span className="text-gray-900">История просмотров</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-[#0066cc]" />
              <h1 className="text-2xl font-bold text-gray-900">История просмотров</h1>
              <span className="text-sm text-gray-500">({history.length})</span>
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:underline"
              >
                Очистить
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded p-12 text-center">
              <Clock size={48} className="mx-auto text-gray-300 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">История пуста</h2>
              <p className="text-sm text-gray-500 mb-4">Здесь будут товары, которые вы смотрели</p>
              <Link
                href="/catalog"
                className="inline-block px-5 py-2 bg-[#0066cc] text-white text-sm rounded hover:bg-[#0052a3] transition-colors"
              >
                В каталог
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="divide-y divide-gray-100">
                {history.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center shrink-0">
                        <Package size={32} className="text-gray-300" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.id}`} className="font-medium text-gray-900 hover:text-[#0066cc] line-clamp-2">
                          {item.name}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">Артикул: {item.article}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="text-xs text-gray-400">{item.category}</div>
                          <div className="text-xs text-gray-400">•</div>
                          <div className="text-xs text-gray-500">{item.viewedAt}</div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-xl font-bold text-gray-900">{item.price} ₽</div>

                        <button className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white text-sm rounded hover:bg-[#0052a3] transition-colors">
                          <ShoppingCart size={16} />
                          В корзину
                        </button>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Удалить из истории"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
