'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Search, Menu, X, Zap, Package, ChevronDown } from 'lucide-react'
import { categories } from '@/lib/mock-data'

const navLinks = [
  { label: 'Каталог', href: '/catalog' },
  { label: 'Бренды', href: '/brands' },
  { label: 'Оптом', href: '/wholesale' },
  { label: 'Доставка', href: '/delivery' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [cartCount] = useState(3)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#07080f]/80 backdrop-blur-xl">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#07080f]/60">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-8 items-center justify-between text-xs text-[#64748b]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#34d399] animate-pulse-dot" />
                Работаем пн–пт 9:00–18:00
              </span>
              <span className="hidden sm:inline">Бесплатная доставка от 5 000 ₽</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:inline">+7 (800) 555-35-35</span>
              <span className="hidden md:inline text-white/20">|</span>
              <a href="#" className="hover:text-[#22d3ee] transition-colors">Помощь</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#22d3ee]/10 ring-1 ring-[#22d3ee]/20">
              <Zap size={16} className="text-[#22d3ee]" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-[#f1f5f9]">ELECTRO</span>
              <span className="text-[#22d3ee]">MAGAZ</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5 rounded-md transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Артикул, наименование, производитель..."
                className="w-full h-9 pl-9 pr-4 text-sm bg-[#0d0f1e] border border-white/6 rounded-lg text-[#f1f5f9] placeholder-[#64748b] outline-none focus:border-[#22d3ee]/40 focus:ring-2 focus:ring-[#22d3ee]/10 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-[#64748b] font-mono border border-white/10 rounded px-1 py-0.5">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5 rounded-md transition-all">
              <Package size={15} />
              <span className="hidden md:inline">Заказы</span>
            </button>
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#f1f5f9] bg-[#22d3ee]/10 hover:bg-[#22d3ee]/15 border border-[#22d3ee]/20 rounded-md transition-all btn-primary"
            >
              <ShoppingCart size={15} className="text-[#22d3ee]" />
              <span className="hidden md:inline">Корзина</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-[#22d3ee] text-[#07080f] text-[10px] font-bold leading-none">
                  {cartCount}
                </span>
              )}
            </Link>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex items-center justify-center size-9 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5 rounded-md transition-all ml-1"
              aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div className="hidden lg:block border-t border-white/5 bg-[#07080f]/40">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-10 items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.slug}
                href={`/catalog?category=${cat.slug}`}
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-[#94a3b8] hover:text-[#22d3ee] hover:bg-[#22d3ee]/5 rounded-md whitespace-nowrap transition-all shrink-0"
              >
                <span className="font-mono text-[11px] opacity-60">{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
            <Link
              href="/catalog"
              className="flex items-center gap-1 px-3 py-1 text-xs text-[#64748b] hover:text-[#94a3b8] rounded-md whitespace-nowrap transition-all shrink-0 ml-auto"
            >
              Все категории
              <ChevronDown size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#0d0f1e]">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-3 py-2.5 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5 rounded-lg transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/5 pt-3 mt-3">
              <p className="px-3 text-xs text-[#64748b] mb-2 uppercase tracking-wider">Категории</p>
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog?category=${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5 rounded-lg transition-all"
                >
                  <span className="font-mono text-xs">{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
