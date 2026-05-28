'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Trash2, Package } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/hooks/use-auth'

// Mock favorites data
const mockFavorites = [
  {
    id: '1',
    name: 'Резистор 10кОм 0.25Вт 5%',
    article: 'CF-25-10K',
    price: 4,
    image: '/products/resistor.jpg',
    inStock: true,
    category: 'Резисторы',
  },
  {
    id: '2',
    name: 'Конденсатор электролитический 100мкФ 25В',
    article: 'CAP-100-25',
    price: 12,
    image: '/products/capacitor.jpg',
    inStock: true,
    category: 'Конденсаторы',
  },
  {
    id: '3',
    name: 'Светодиод красный 5мм',
    article: 'LED-RED-5MM',
    price: 8,
    image: '/products/led.jpg',
    inStock: false,
    category: 'Светодиоды',
  },
]

export default function FavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState(mockFavorites)

  if (!user) {
    return (
      <>
        <Header />
        <StickyNav />
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Войдите в аккаунт</h2>
              <p className="text-gray-500 mb-4">Чтобы увидеть избранные товары</p>
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

  const removeFavorite = (id: string) => {
    setFavorites(favorites.filter(item => item.id !== id))
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
            <span className="text-gray-900">Избранное</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Heart size={24} className="text-[#0066cc]" />
            <h1 className="text-2xl font-bold text-gray-900">Избранное</h1>
            <span className="text-sm text-gray-500">({favorites.length})</span>
          </div>

          {favorites.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded p-12 text-center">
              <Heart size={48} className="mx-auto text-gray-300 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Список пуст</h2>
              <p className="text-sm text-gray-500 mb-4">Добавляйте товары в избранное</p>
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
                {favorites.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center shrink-0">
                        <Package size={28} className="text-gray-300" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.id}`} className="font-medium text-gray-900 hover:text-[#0066cc]">
                          {item.name}
                        </Link>
                        <div className="text-sm text-gray-500 mt-1">Арт: {item.article}</div>
                        <div className="text-xs text-gray-400 mt-1">{item.category}</div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">{item.price} ₽</div>
                          {item.inStock ? (
                            <div className="text-xs text-green-600 mt-1">В наличии</div>
                          ) : (
                            <div className="text-xs text-red-600 mt-1">Нет в наличии</div>
                          )}
                        </div>

                        <button
                          disabled={!item.inStock}
                          className="px-4 py-2 bg-[#0066cc] text-white text-sm rounded hover:bg-[#0052a3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          В корзину
                        </button>

                        <button
                          onClick={() => removeFavorite(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Удалить"
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
