'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
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
    <div className="sticky top-0 z-50">
      <div className="mx-auto max-w-[1400px] px-4 relative">
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
          </div>

          {/* Search — live autocomplete with full dropdown */}
          <LiveSearchDropdown />

          {/* Right icons — постоянный серый фон */}
          <div className="hidden lg:flex items-stretch shrink-0 bg-gray-100 h-[68px] rounded-r">
            <Link
              href="/cart"
              data-cart-icon
              className="flex flex-col items-center justify-center gap-1.5 px-6 text-gray-600 hover:text-[#0066cc] transition-colors relative"
            >
              <div className="relative">
                <ShoppingCart size={26} strokeWidth={1.5} />
                <span className="absolute -top-2 -right-2.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[#f97316] text-white leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </div>
              <span className="text-[13px] leading-none font-bold text-gray-800">
                {cartMounted && totalPrice > 0 ? `${formattedTotal} ₽` : 'Запрос'}
              </span>
            </Link>
          </div>

          {/* Mobile cart */}
          <Link href="/cart" data-cart-icon className="lg:hidden relative flex items-center justify-center size-9 text-gray-600">
            <ShoppingCart size={20} />
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full text-[9px] font-bold bg-[#f97316] text-white">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          </Link>
        </div>
      </div>

      {/* Mega menu - ChipDip style - positioned absolutely relative to parent */}
      {catalogOpen && (
        <div ref={catalogMenuRef} className="absolute top-[68px] left-0 right-0 mx-auto max-w-[1400px] px-4 z-[60]">
          <div className="bg-white border border-gray-200 shadow-xl max-h-[500px] overflow-y-auto">
            <div className="flex">
              {/* Left column - main categories */}
              <div className="w-[240px] bg-white border-r border-gray-200">
                <ul className="py-1">
                  {cats.length > 0 ? (
                    cats.map((cat) => (
                      <li
                        key={cat.slug}
                        onMouseEnter={() => setHoveredCategory(cat.slug)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        <Link
                          href={`/catalog?category=${cat.slug}`}
                          className={`block px-4 py-2 text-sm transition-colors cursor-pointer ${
                            hoveredCategory === cat.slug
                              ? 'bg-[#f5f5f5] text-[#0066cc]'
                              : 'text-gray-800 hover:bg-[#f5f5f5] hover:text-[#0066cc]'
                          }`}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-8 text-center text-gray-400 text-sm">
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
                              className="text-sm text-gray-700 hover:text-[#0066cc] hover:underline transition-colors py-1 block"
                            >
                              {subcat.name}
                            </Link>
                          ))}
                  </div>
                ) : hoveredCategory ? (
                  <div className="text-sm text-gray-400 py-8 text-center">
                    Подкатегории отсутствуют
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 py-8 text-center">
                    Наведите на категорию
                  </div>
                )}
              </div>
            </div>

            {/* Footer with "Весь каталог" button */}
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {totalProducts > 0 ? `${totalProducts.toLocaleString('ru-RU')} товаров` : '2 000 000+ товаров'}
              </span>
              <Link
                href="/catalog"
                onClick={() => setCatalogOpen(false)}
                className="text-xs font-semibold text-[#0066cc] hover:underline"
              >
                Весь каталог →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
