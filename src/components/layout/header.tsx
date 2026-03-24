'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Search, Menu, X, Zap, User, LogOut } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'

const navLinks = [
  { label: 'Каталог', href: '/catalog' },
  { label: 'Бренды', href: '/brands' },
  { label: 'Оптом', href: '/wholesale' },
  { label: 'Доставка', href: '/delivery' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { totalItems } = useCart()
  const { user, mounted: authMounted, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white shadow-md">
      {/* Top bar */}
      <div className="border-b border-black/8 bg-[#f0fdf4]">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-8 items-center justify-between text-xs text-[#166534]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#15803d] animate-pulse-dot" />
                Работаем пн–пт 9:00–18:00
              </span>
              <span className="hidden sm:inline">Доставка по всей России</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline font-medium text-[#166534]">+7 (800) 555-35-35</span>
              <span className="hidden md:inline text-[#166534]/20">|</span>
              <Link href="/delivery" className="hover:text-[#15803d] transition-colors font-medium">Доставка</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#166534] shadow-sm">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-[#1c1917]">ELECTRO</span>
              <span className="text-[#166534]">MAGAZ</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-[#78716c] hover:text-[#1c1917] hover:bg-black/5 rounded-md transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Артикул, наименование, производитель..."
                className="w-full h-9 pl-9 pr-4 text-sm bg-[#fef3e8] border border-black/8 rounded-lg text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/10 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-[#a8a29e] font-mono border border-black/10 rounded px-1 py-0.5 bg-white">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Account */}
            {authMounted && (
              user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <Link
                    href="/account"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#78716c] hover:text-[#166534] hover:bg-[#166534]/5 rounded-md transition-all"
                  >
                    <div className="flex size-5 items-center justify-center rounded-full bg-[#166534] text-white text-[9px] font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center justify-center size-8 text-[#a8a29e] hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                    aria-label="Выйти"
                    title="Выйти"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/account"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#78716c] hover:text-[#1c1917] hover:bg-black/5 rounded-md transition-all"
                >
                  <User size={15} />
                  <span className="hidden md:inline">Войти</span>
                </Link>
              )
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-[#166534] hover:bg-[#15803d] rounded-md transition-all btn-primary shadow-sm"
            >
              <ShoppingCart size={15} />
              <span className="hidden md:inline">Корзина</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-[#f97316] text-white text-[10px] font-bold leading-none">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center justify-center size-9 text-[#78716c] hover:text-[#1c1917] hover:bg-black/5 rounded-md transition-all ml-1"
              aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-black/6 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm text-[#78716c] hover:text-[#1c1917] hover:bg-black/4 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-black/6 pt-3 mt-3">
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#78716c] hover:text-[#166534] hover:bg-[#166534]/5 rounded-lg transition-all"
                  >
                    <div className="flex size-5 items-center justify-center rounded-full bg-[#166534] text-white text-[9px] font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false) }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#a8a29e] hover:text-red-500 rounded-lg transition-all w-full"
                  >
                    <LogOut size={14} />
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#78716c] hover:text-[#1c1917] hover:bg-black/4 rounded-lg transition-all"
                >
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
