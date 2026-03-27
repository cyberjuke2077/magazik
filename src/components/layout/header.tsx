'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ShoppingCart, Search, Menu, X, Zap, User, LogOut, Phone, ChevronRight } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { categories } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/ui/component-icons'

const navLinks = [
  { label: 'Каталог', href: '/catalog' },
  { label: 'Бренды', href: '/brands' },
  { label: 'Оптом', href: '/wholesale' },
  { label: 'Доставка', href: '/delivery' },
]

// Цвета категорий для мегаменю
const catColors: Record<string, string> = {
  rezistory:    'bg-blue-50 text-blue-600',
  kondensatory: 'bg-cyan-50 text-cyan-600',
  mikroskhemy:  'bg-indigo-50 text-indigo-600',
  tranzistory:  'bg-violet-50 text-violet-600',
  rele:         'bg-emerald-50 text-emerald-600',
  datchiki:     'bg-teal-50 text-teal-600',
  kontrollery:  'bg-orange-50 text-orange-600',
  diody:        'bg-red-50 text-red-600',
  svetodiody:   'bg-yellow-50 text-yellow-600',
  razyomy:      'bg-pink-50 text-pink-600',
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { totalItems } = useCart()
  const { user, mounted: authMounted, logout } = useAuth()
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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#166534] shadow-sm">
              <Zap size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold text-gray-900 leading-none tracking-tight">
                ELECTRO<span className="text-[#166534]">MAGAZ</span>
              </div>
              <div className="text-[10px] text-gray-400 leading-none mt-0.5 tracking-wide">
                электронные компоненты
              </div>
            </div>
          </Link>

          {/* Catalog button + megamenu */}
          <div ref={catalogRef} className="relative shrink-0">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={`flex items-center gap-2 h-10 px-4 text-sm font-semibold rounded-xl transition-all ${
                catalogOpen
                  ? 'bg-[#15803d] text-white'
                  : 'bg-[#166534] text-white hover:bg-[#15803d]'
              }`}
            >
              {catalogOpen ? <X size={15} /> : <Menu size={15} />}
              <span className="hidden sm:inline">Каталог</span>
            </button>

            {/* Mega menu */}
            {catalogOpen && (
              <div className="absolute top-full left-0 mt-2 w-[560px] bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-slide-down">
                <div className="p-3 grid grid-cols-2 gap-1">
                  {categories.map((cat) => {
                    const cs = catColors[cat.slug] ?? 'bg-gray-50 text-gray-500'
                    return (
                      <Link
                        key={cat.slug}
                        href={`/catalog?category=${cat.slug}`}
                        onClick={() => setCatalogOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-150 group"
                      >
                        <div className={`flex size-9 items-center justify-center rounded-xl shrink-0 ${cs}`}>
                          <CategoryIcon slug={cat.slug} size={22} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 group-hover:text-[#166534] transition-colors truncate">
                            {cat.name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{cat.description}</div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-500">500 000+ позиций в наличии</span>
                  <Link
                    href="/catalog"
                    onClick={() => setCatalogOpen(false)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#166534] hover:underline"
                  >
                    Весь каталог <ChevronRight size={11} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Артикул, наименование, производитель..."
                className="w-full h-10 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 transition-all"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Phone */}
            <a
              href="tel:+78005553535"
              className="hidden xl:flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-[#166534] transition-colors"
            >
              <Phone size={14} className="text-[#166534]" />
              8 (800) 555-35-35
            </a>

            {/* Account */}
            {authMounted && (
              user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#166534] hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <div className="flex size-6 items-center justify-center rounded-full bg-[#166534] text-white text-[10px] font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline max-w-[72px] truncate text-sm font-medium">
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Выйти"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/account"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <User size={15} />
                  <span className="hidden md:inline">Войти</span>
                </Link>
              )
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] rounded-xl transition-all shadow-sm hover:shadow-lg hover:shadow-[#166534]/25 btn-primary"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Корзина</span>
              {totalItems > 0 ? (
                <span
                  key={totalItems}
                  className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-[#f97316] text-white animate-bounce-in"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              ) : (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  0
                </span>
              )}
            </Link>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center justify-center size-10 text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white animate-slide-down">
          <div className="mx-auto max-w-7xl px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              {user ? (
                <div className="flex items-center justify-between px-3 py-2">
                  <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="flex size-6 items-center justify-center rounded-full bg-[#166534] text-white text-[10px] font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </Link>
                  <button onClick={() => { logout(); setMobileOpen(false) }} className="text-gray-400 hover:text-red-500 p-1">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                  <User size={15} />
                  Войти / Регистрация
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
