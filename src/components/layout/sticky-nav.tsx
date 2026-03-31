'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, Search, User, Package, Menu, X } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { categories } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/ui/component-icons'

export function StickyNav() {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { items } = useCart()
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

  return (
    <div className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex items-center gap-3 h-14">

          {/* Catalog button */}
          <div ref={catalogRef} className="relative shrink-0">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={`flex items-center gap-2.5 h-11 px-5 text-sm font-bold transition-all ${
                catalogOpen
                  ? 'bg-[#0052a3] text-white'
                  : 'bg-[#0066cc] text-white hover:bg-[#0052a3]'
              }`}
            >
              <div className="grid grid-cols-2 gap-0.5 shrink-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="size-1.5 bg-white/80" />
                ))}
              </div>
              <span>Каталог</span>
            </button>

            {/* Mega menu */}
            {catalogOpen && (
              <div className="absolute top-full left-0 mt-0 w-[600px] bg-white border border-gray-200 shadow-xl overflow-hidden animate-slide-down z-50">
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

          {/* Search */}
          <div className="flex-1">
            <div className="relative flex">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Поиск среди 500 000 товаров"
                className="flex-1 h-11 pl-10 pr-4 text-sm bg-white border border-gray-300 text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors"
              />
              <button className="h-11 px-5 bg-gray-100 border border-l-0 border-gray-300 text-sm text-gray-600 hover:bg-gray-200 transition-colors shrink-0">
                Найти
              </button>
            </div>
          </div>

          {/* Right icons */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {authMounted && (
              user ? (
                <Link
                  href="/account"
                  className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-gray-600 hover:text-[#0066cc] transition-colors"
                >
                  <div className="flex size-6 items-center justify-center rounded-full bg-[#0066cc] text-white text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[11px] leading-none">{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link
                  href="/account"
                  className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-gray-600 hover:text-[#0066cc] transition-colors"
                >
                  <User size={20} strokeWidth={1.5} />
                  <span className="text-[11px] leading-none">Вход</span>
                </Link>
              )
            )}

            <Link
              href="/account"
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-gray-600 hover:text-[#0066cc] transition-colors"
            >
              <Package size={20} strokeWidth={1.5} />
              <span className="text-[11px] leading-none">Заказы</span>
            </Link>

            <Link
              href="/cart"
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-gray-600 hover:text-[#0066cc] transition-colors relative"
            >
              <div className="relative">
                <ShoppingCart size={20} strokeWidth={1.5} />
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold bg-[#f97316] text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </div>
              <span className="text-[11px] leading-none">Корзина</span>
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
