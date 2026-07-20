'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Boxes, CircleHelp, GitCompareArrows, Grid3X3, Home, MessageSquare, ShoppingCart } from 'lucide-react'
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
  const pathname = usePathname()
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const catalogMenuRef = useRef<HTMLDivElement>(null)
  const { items, totalPrice, mounted: cartMounted } = useCart()
  const cartCount = items.length
  const catalogRef = useRef<HTMLDivElement>(null)

  // На страницах, где категории не переданы пропсом (контакты, доставка и т.д.),
  // подгружаем дерево разделов клиентом, чтобы мега-меню работало везде.
  const [fetchedCats, setFetchedCats] = useState<CategoryWithChildren[]>([])
  const [categoryLoadError, setCategoryLoadError] = useState(false)
  const cats = categories.length > 0 ? categories : fetchedCats

  useEffect(() => {
    if (categories.length > 0) return
    let active = true
    fetch('/api/catalog/categories')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Не удалось загрузить категории: HTTP ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (active && Array.isArray(data)) setFetchedCats(data)
      })
      .catch(() => {
        if (active) setCategoryLoadError(true)
      })
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
  const activeCategory = cats.find((category) => category.slug === hoveredCategory) ?? cats[0]
  const relatedCategories = cats.filter((category) => category.slug !== activeCategory?.slug).slice(0, 8)

  return (
    <div className="sticky top-0 z-[var(--layer-header)] bg-white shadow-[var(--shadow-xs)]">
      <div className="relative mx-auto max-w-[1380px]">
        <div className="flex h-12 items-center gap-2 px-4 lg:grid lg:h-24 lg:grid-cols-[280px_minmax(0,1fr)_327px] lg:gap-4 lg:px-0">
          <div className="storefront-brand-panel hidden h-16 items-center overflow-hidden rounded-2xl bg-azure lg:flex">
            <Link href="/" className="flex h-full w-36 shrink-0 items-center px-4">
              <span className="text-[21px] font-extrabold leading-none tracking-[-0.055em] text-white">
                electro<span className="text-white/88">magaz</span><span className="text-white">.</span>
              </span>
            </Link>
            <div ref={catalogRef} className="relative flex flex-1 justify-center">
              <button
                onClick={() => setCatalogOpen(!catalogOpen)}
                className="flex h-11 w-[124px] items-center justify-center gap-2 rounded-xl bg-white/14 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/22 active:translate-y-0 active:scale-[0.98]"
                aria-expanded={catalogOpen}
              >
                <Grid3X3 size={17} />
                <span>Каталог</span>
              </button>
            </div>
          </div>

          <LiveSearchDropdown />

          <Link
            href="/contacts"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f7f7] text-ink-3 transition-colors hover:text-azure lg:hidden"
            aria-label="Связаться с нами"
          >
            <MessageSquare size={18} strokeWidth={1.7} />
          </Link>

          <div className="hidden h-16 grid-cols-[90px_90px_90px_57px] lg:grid">
            <HeaderAction href="/compare" label="Сравнение" icon={GitCompareArrows} active={pathname === '/compare'} />
            <HeaderAction href="/brands" label="Бренды" icon={Boxes} active={pathname === '/brands'} />
            <HeaderAction
              href="/cart"
              label={cartMounted && totalPrice > 0 ? `${formattedTotal} ₽` : 'Корзина'}
              icon={ShoppingCart}
              count={cartCount}
              cart
              active={pathname === '/cart' || pathname.startsWith('/request-')}
            />
            <HeaderAction href="/help" label="Помощь" icon={CircleHelp} compact active={pathname === '/help'} />
          </div>
        </div>
      </div>

      {/* Mega menu - ChipDip style - positioned absolutely relative to parent */}
      {catalogOpen && (
        <div ref={catalogMenuRef} className="absolute left-0 right-0 top-24 z-[var(--layer-menu)] mx-auto max-w-[1380px]">
          <div className="h-[calc(100dvh-145px)] overflow-hidden overflow-y-auto border border-t-0 border-[var(--border)] bg-white shadow-[var(--shadow-xl)]">
            <div className="flex min-h-[calc(100%-45px)]">
              {/* Left column - main categories */}
              <div className="w-[280px] shrink-0 border-r border-[var(--border)] bg-white">
                <ul className="py-3">
                  {cats.length > 0 ? (
                    cats.map((cat) => (
                      <li
                        key={cat.slug}
                        onMouseEnter={() => setHoveredCategory(cat.slug)}
                      >
                        <Link
                          href={`/catalog?category=${cat.slug}`}
                          className={`flex min-h-10 items-center gap-3 px-4 text-sm transition-colors ${
                            activeCategory?.slug === cat.slug
                              ? 'bg-[#f7f7f7] font-semibold text-accent'
                              : 'text-ink-2 hover:bg-[#f7f7f7] hover:text-accent'
                          }`}
                        >
                          <Grid3X3 size={17} strokeWidth={1.6} className="shrink-0 text-accent" />
                          {cat.name}
                        </Link>
                      </li>
                    ))
                  ) : categoryLoadError ? (
                    <li className="px-4 py-8 text-center text-sm text-red-600">
                      Категории не загрузились. Откройте весь каталог.
                    </li>
                  ) : (
                    <li className="px-4 py-8 text-center text-ink-4 text-sm">
                      Категории загружаются...
                    </li>
                  )}
                </ul>
              </div>

              {/* Right column - subcategories */}
              <div className="flex-1 overflow-y-auto bg-white px-8 py-6">
                {activeCategory ? (
                  <>
                    <h2 className="text-[18px] font-bold text-ink">{activeCategory.name}</h2>
                    {(activeCategory.children?.length ?? 0) > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-x-10 gap-y-2">
                        {activeCategory.children?.map((subcat) => (
                          <Link
                            key={subcat.slug}
                            href={`/catalog?category=${subcat.slug}`}
                            className="text-sm leading-snug text-ink-2 transition-colors hover:text-azure"
                          >
                            {subcat.name}
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="mt-8 grid grid-cols-3 gap-x-10 gap-y-8">
                      {relatedCategories.map((category) => (
                        <div key={category.slug}>
                          <Link
                            href={`/catalog?category=${category.slug}`}
                            className="text-[16px] font-bold leading-tight text-ink transition-colors hover:text-azure"
                          >
                            {category.name}
                          </Link>
                          <div className="mt-3 space-y-2">
                            {category.children?.slice(0, 5).map((child) => (
                              <Link
                                key={child.slug}
                                href={`/catalog?category=${child.slug}`}
                                className="block text-sm leading-snug text-ink-3 transition-colors hover:text-azure"
                              >
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : categoryLoadError ? (
                  <div className="py-8 text-center text-sm text-red-600">
                    Не удалось загрузить категории. Перейдите в каталог.
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-ink-4">
                    Категории загружаются...
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
        <MobileNavItem href="/" label="Главная" icon={Home} active={pathname === '/'} />
        <MobileNavItem href="/catalog" label="Каталог" icon={Grid3X3} active={pathname.startsWith('/catalog')} />
        <MobileNavItem href="/compare" label="Сравнить" icon={GitCompareArrows} active={pathname === '/compare'} />
        <MobileNavItem href="/cart" label="Корзина" icon={ShoppingCart} active={pathname === '/cart' || pathname.startsWith('/request-')} />
        <MobileNavItem href="/help" label="Помощь" icon={CircleHelp} active={pathname === '/help'} />
      </nav>
    </div>
  )
}

function HeaderAction({
  href,
  label,
  icon: Icon,
  count,
  cart = false,
  compact = false,
  active = false,
}: {
  href: string
  label: string
  icon: typeof Home
  count?: number
  cart?: boolean
  compact?: boolean
  active?: boolean
}) {
  return (
    <Link
      href={href}
      data-cart-icon={cart ? true : undefined}
      aria-current={active ? 'page' : undefined}
      className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition duration-200 hover:-translate-y-0.5 hover:bg-surface-muted hover:text-azure active:translate-y-0 ${
        active ? 'bg-azure-light text-azure' : 'text-ink-2'
      } ${
        compact ? 'w-[57px]' : 'w-[90px]'
      }`}
    >
      <span className="relative">
        <Icon size={21} strokeWidth={1.6} />
        {typeof count === 'number' && count > 0 && (
          <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 animate-bounce-in items-center justify-center rounded-full bg-azure px-1 text-[9px] font-bold leading-none text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
      <span className="max-w-full truncate px-1">{label}</span>
    </Link>
  )
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string
  label: string
  icon: typeof Home
  active?: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${active ? 'text-azure' : 'text-ink-3 hover:text-azure'}`}
    >
      {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-azure" />}
      <Icon size={20} strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </Link>
  )
}
