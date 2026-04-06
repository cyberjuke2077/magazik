'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, Search, User, Package } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { categories } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/ui/component-icons'

export function StickyNav() {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { items, totalPrice, mounted: cartMounted } = useCart()
  const cartCount = items.length
  const { user, mounted: authMounted } = useAuth()
  const catalogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setCatalogOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const formattedTotal = cartMounted
    ? totalPrice.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
    : ''

  return (
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex items-center h-[68px] rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12),_0_4px_12px_rgba(0,102,204,0.15)] bg-white">

          {/* Catalog button */}
          <div ref={catalogRef} className="relative shrink-0">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={`flex items-center gap-3 h-[68px] px-7 font-bold transition-all rounded-l ${
                catalogOpen
                  ? 'bg-[#0052a3] text-white'
                  : 'bg-[#0066cc] text-white hover:bg-[#0052a3]'
              }`}
            >
              <div className="grid grid-cols-3 gap-[2px] shrink-0">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="size-[4px] bg-white/90" />
                ))}
              </div>
              <span className="text-[16px]">Каталог</span>
            </button>

            {/* Mega menu */}
            {catalogOpen && (
              <div className="absolute top-full left-0 mt-0 w-[600px] bg-white border border-gray-200 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-slide-down z-50">
                <div className="p-3 grid grid-cols-2 gap-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/catalog?category=${cat.slug}`}
                      onClick={() => setCatalogOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex size-8 items-center justify-center bg-[#e8f4ff] shrink-0">
                        <CategoryIcon slug={cat.slug} size={20} className="text-[#0066cc]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-gray-800 group-hover:text-[#0066cc] transition-colors truncate">
                          {cat.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{cat.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">500 000+ позиций</span>
                    <Link
                      href="/catalog"
                      onClick={() => setCatalogOpen(false)}
                      className="text-xs font-semibold text-[#0066cc] hover:underline"
                    >
                    Весь каталог →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Search — с тремя точками справа */}
          <div className="flex-1">
            <div className="relative bg-white h-[68px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Поиск среди 500 000 товаров"
                className="w-full h-full pl-12 pr-4 text-[16px] bg-transparent text-gray-900 placeholder-gray-400 outline-none"
              />
              {/* Три точки — декоративный элемент */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
                <div className="w-1 h-1 rounded-full bg-gray-400" />
                <div className="w-1 h-1 rounded-full bg-gray-400" />
                <div className="w-1 h-1 rounded-full bg-gray-400" />
              </div>
            </div>
          </div>

          {/* Right icons — постоянный серый фон */}
          <div className="hidden lg:flex items-stretch shrink-0 bg-gray-100 h-[68px] rounded-r">
            {authMounted && (
              user ? (
                <Link
                  href="/account"
                  className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-[#0066cc] text-white text-[11px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[13px] leading-none whitespace-nowrap">{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link
                  href="/account"
                  className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors"
                >
                  <User size={26} strokeWidth={1.5} />
                  <span className="text-[13px] leading-none">Вход</span>
                </Link>
              )
            )}

            <Link
              href="/account"
              className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors"
            >
              <Package size={26} strokeWidth={1.5} />
              <span className="text-[13px] leading-none">Статус заказа</span>
            </Link>

            <Link
              href="/cart"
              className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors relative"
            >
              <div className="relative">
                <ShoppingCart size={26} strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[#f97316] text-white leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </div>
              <span className="text-[13px] leading-none font-bold text-gray-800">
                {cartMounted && totalPrice > 0 ? `${formattedTotal} ₽` : 'Корзина'}
              </span>
            </Link>
          </div>

          {/* Mobile cart */}
          <Link href="/cart" className="lg:hidden relative flex items-center justify-center size-9 text-gray-600">
            <ShoppingCart size={20} />
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full text-[9px] font-bold bg-[#f97316] text-white">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
