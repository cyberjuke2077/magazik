'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { FileText, GitCompareArrows, Grid3X3, Home, ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { LiveSearchDropdown } from '@/components/ui/live-search-dropdown'

interface CategoryWithChildren {
  id: string
  slug: string
  name: string
  icon: string | null
  description?: string | null
  children?: {
    id: string
    slug: string
    name: string
    icon: string | null
  }[]
}

interface StickyNavProps {
  categories?: CategoryWithChildren[]
  totalProducts?: number
}

export function StickyNav({ categories = [], totalProducts = 0 }: StickyNavProps) {
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const catalogMenuRef = useRef<HTMLDivElement>(null)
  const { items, totalPrice, mounted: cartMounted } = useCart()
  const cartCount = items.length
  const catalogRef = useRef<HTMLDivElement>(null)

  // На страницах, где категории не переданы пропсом (контакты, доставка и т.д.),
  // подгружаем дерево разделов клиентом, чтобы мега-меню работало везде.
  const [fetchedCats, setFetchedCats] = useState<CategoryWithChildren[]>([])
  const cats = categories.length > 0 ? categories : fetchedCats

  useEffect(() => {
    if (categories.length > 0) return
    let active = true
    fetch('/api/catalog/categories')
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data)) setFetchedCats(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [categories.length])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      // Close catalog if click is outside both button and menu
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        if (catalogMenuRef.current && !catalogMenuRef.current.contains(e.target as Node)) {
          setCatalogOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const formattedTotal = cartMounted
    ? totalPrice.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
    : ''

  return (
    <div className="sticky top-0 z-[var(--layer-header)] border-b border-[var(--border)] bg-white shadow-[var(--shadow-xs)]">
      <div className="relative mx-auto max-w-[1440px] px-3 sm:px-6">
        <div className="flex h-[60px] items-center gap-2 lg:gap-3">

          <Link href="/" className="hidden shrink-0 lg:block">
            <span className="text-[26px] font-extrabold leading-none tracking-tight text-ink">
              electro<span className="text-azure">magaz</span><span className="text-azure">.</span>
            </span>
          </Link>

          {/* Catalog button */}
          <Link
            href="/catalog"
            className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-accent text-white lg:hidden"
            aria-label="Открыть каталог"
          >
            <Grid3X3 size={19} />
          </Link>
          <div ref={catalogRef} className="relative hidden shrink-0 lg:block">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={`flex h-11 items-center gap-2.5 rounded-[var(--radius-control)] px-5 text-sm font-bold transition-colors ${
                catalogOpen
                  ? 'bg-accent-hover text-white'
                  : 'bg-accent text-white hover:bg-accent-hover'
              }`}
              aria-expanded={catalogOpen}
            >
              <Grid3X3 size={18} />
              <span>Каталог</span>
            </button>
          </div>

          {/* Search — live autocomplete with full dropdown */}
          <LiveSearchDropdown />

          <Link
            href="/compare"
            className="hidden h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] px-3 text-[11px] font-medium text-ink-3 transition-colors hover:bg-surface-muted hover:text-azure lg:flex"
          >
            <GitCompareArrows size={19} strokeWidth={1.8} />
            Сравнение
          </Link>

          <Link
            href="/cart"
            data-cart-icon
            className="relative flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-ink-3 transition-colors hover:bg-surface-muted hover:text-azure lg:h-11 lg:w-auto lg:min-w-[92px] lg:gap-2 lg:px-3"
          >
            <span className="relative">
              <ShoppingCart size={21} strokeWidth={1.8} />
              <span className="absolute -right-2 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </span>
            <span className="hidden text-xs font-semibold text-ink lg:block">
              {cartMounted && totalPrice > 0 ? `${formattedTotal} ₽` : 'Запрос'}
            </span>
          </Link>
        </div>
      </div>

      {/* Mega menu - ChipDip style - positioned absolutely relative to parent */}
      {catalogOpen && (
        <div ref={catalogMenuRef} className="absolute left-0 right-0 top-[60px] z-[var(--layer-menu)] mx-auto max-w-[1440px] px-6">
          <div className="max-h-[560px] overflow-hidden overflow-y-auto rounded-b-[var(--radius-panel)] border border-t-0 border-[var(--border)] bg-white shadow-[var(--shadow-xl)]">
            <div className="flex">
              {/* Left column - main categories */}
              <div className="w-[240px] bg-white border-r border-[var(--border)]">
                <ul className="py-1">
                  {cats.length > 0 ? (
                    cats.map((cat) => (
                      <li
                        key={cat.slug}
                        onMouseEnter={() => setHoveredCategory(cat.slug)}
                      >
                        <Link
                          href={`/catalog?category=${cat.slug}`}
                          className={`block px-4 py-2 text-sm transition-colors cursor-pointer ${
                            hoveredCategory === cat.slug
                              ? 'bg-[#f5f5f5] text-azure'
                              : 'text-ink hover:bg-[#f5f5f5] hover:text-azure'
                          }`}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-8 text-center text-ink-4 text-sm">
                      Категории загружаются...
                    </li>
                  )}
                </ul>
              </div>

              {/* Right column - subcategories */}
              <div className="flex-1 bg-white p-4 overflow-y-auto">
                {hoveredCategory && (cats.find(c => c.slug === hoveredCategory)?.children?.length ?? 0) > 0 ? (
                  <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                    {cats
                      .find(c => c.slug === hoveredCategory)
                      ?.children?.map((subcat) => (
                            <Link
                              key={subcat.slug}
                              href={`/catalog?category=${subcat.slug}`}
                              className="text-sm text-ink-2 hover:text-azure hover:underline transition-colors py-1 block"
                            >
                              {subcat.name}
                            </Link>
                          ))}
                  </div>
                ) : hoveredCategory ? (
                  <div className="text-sm text-ink-4 py-8 text-center">
                    Подкатегории отсутствуют
                  </div>
                ) : (
                  <div className="text-sm text-ink-4 py-8 text-center">
                    Наведите на категорию
                  </div>
                )}
              </div>
            </div>

            {/* Footer with "Весь каталог" button */}
            <div className="flex items-center justify-between border-t border-[var(--border)] bg-surface-muted px-4 py-2.5">
              <span className="text-xs text-ink-3">
                {totalProducts > 0 ? `${totalProducts.toLocaleString('ru-RU')} товаров` : '2 000 000+ товаров'}
              </span>
              <Link
                href="/catalog"
                onClick={() => setCatalogOpen(false)}
                className="text-xs font-semibold text-azure hover:underline"
              >
                Весь каталог
              </Link>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-[var(--layer-header)] grid h-16 grid-cols-5 border-t border-[var(--border)] bg-white px-1 lg:hidden">
        <MobileNavItem href="/" label="Главная" icon={Home} />
        <MobileNavItem href="/catalog" label="Каталог" icon={Grid3X3} />
        <MobileNavItem href="/compare" label="Сравнить" icon={GitCompareArrows} />
        <MobileNavItem href="/cart" label="Запрос" icon={ShoppingCart} />
        <MobileNavItem href="/request-quote" label="КП" icon={FileText} />
      </nav>
    </div>
  )
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: typeof Home
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium text-ink-3 transition-colors hover:text-azure"
    >
      <Icon size={20} strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </Link>
  )
}
