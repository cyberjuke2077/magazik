'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  SlidersHorizontal, Grid3X3, List, Search, X,
  ChevronDown, ChevronUp, ChevronRight, ShoppingCart, Check, Plus, Minus,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { CategoryIcon } from '@/components/ui/component-icons'
import { formatPrice, formatNumber } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { type Product } from '@/lib/queries/products'

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

interface CategoryPageClientProps {
  category: CategoryWithChildren
  parentCategory: CategoryWithChildren | null
  allCategories: CategoryWithChildren[]
  products: Product[]
  totalProducts: number
}

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name' | 'stock'
type ViewMode = 'grid' | 'list'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popular',    label: 'Рекомендуем' },
  { value: 'price-asc',  label: 'Дешевле' },
  { value: 'price-desc', label: 'Дороже' },
  { value: 'name',       label: 'По названию' },
  { value: 'stock',      label: 'Количество' },
]

function FilterBlock({ title, children, open: defaultOpen = true }: {
  title: string; children: React.ReactNode; open?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2.5 group"
      >
        <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
          {open
            ? <ChevronUp size={13} className="text-gray-500" />
            : <ChevronDown size={13} className="text-gray-500" />
          }
          {title}
        </span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

function ProductListRow({ product }: { product: Product }) {
  const { addItem, isInCart, getQuantity, updateQuantity } = useCart()
  const [qty, setQty] = useState(product.minOrder)
  const inCart = isInCart(product.id)
  const cartQty = getQuantity(product.id)
  const [added, setAdded] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group px-2">
      <Link href={`/product/${product.slug}`} className="flex size-16 items-center justify-center bg-[#e8f4ff] shrink-0">
        <CategoryIcon slug={product.categorySlug} size={36} className="text-[#0066cc] opacity-60 group-hover:opacity-90 transition-opacity" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{product.manufacturer}</div>
        <Link href={`/product/${product.slug}`} className="text-sm font-semibold text-[#0066cc] hover:underline leading-snug line-clamp-2 block">
          {product.partNumber}, {product.name}
        </Link>
        <div className="text-xs text-gray-400 mt-0.5">Бренд: {product.manufacturer}</div>
      </div>

      <div className="shrink-0 text-center w-24">
        {product.inStock ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-[#16a34a]">
            <Check size={13} /> {product.stockCount.toLocaleString('ru-RU')} шт.
          </span>
        ) : (
          <span className="text-sm text-gray-400">Под заказ</span>
        )}
        <div className="text-xs text-gray-400 mt-0.5">1–2 недели</div>
      </div>

      <div className="shrink-0 flex items-center gap-3">
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</div>
          <div className="text-xs text-gray-400">× {inCart ? cartQty : qty} {product.unit}</div>
        </div>

        {inCart ? (
          <div className="flex items-center gap-1 border border-gray-300 rounded">
            <button onClick={() => updateQuantity(product.id, Math.max(product.minOrder, cartQty - 1))}
              className="flex items-center justify-center size-8 text-gray-600 hover:bg-gray-100 transition-colors">
              <Minus size={12} />
            </button>
            <span className="text-sm font-semibold text-gray-900 w-8 text-center">{cartQty}</span>
            <button onClick={() => updateQuantity(product.id, cartQty + 1)}
              className="flex items-center justify-center size-8 text-gray-600 hover:bg-gray-100 transition-colors">
              <Plus size={12} />
            </button>
          </div>
        ) : (
          <button onClick={handleAdd}
            className={`flex items-center justify-center gap-1.5 h-9 px-4 text-sm font-semibold text-white transition-all ${
              added ? 'bg-[#16a34a]' : 'bg-[#0066cc] hover:bg-[#0052a3]'
            }`}>
            {added ? <><Check size={14} /> В корзине</> : <><ShoppingCart size={14} /> В корзину</>}
          </button>
        )}
      </div>
    </div>
  )
}

export function CategoryPageClient({ 
  category, 
  parentCategory, 
  allCategories, 
  products, 
  totalProducts 
}: CategoryPageClientProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)

  const [pendingBrands, setPendingBrands] = useState<string[]>([])
  const [pendingPriceMin, setPendingPriceMin] = useState('')
  const [pendingPriceMax, setPendingPriceMax] = useState('')
  const [pendingInStock, setPendingInStock] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('popular')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const hasPendingChanges =
    JSON.stringify(pendingBrands) !== JSON.stringify(selectedBrands) ||
    pendingPriceMin !== priceMin ||
    pendingPriceMax !== priceMax ||
    pendingInStock !== inStockOnly

  function applyFilters() {
    setSelectedBrands(pendingBrands)
    setPriceMin(pendingPriceMin)
    setPriceMax(pendingPriceMax)
    setInStockOnly(pendingInStock)
    setFiltersOpen(false)
  }

  const filtered = useMemo(() => {
    let r = [...products]
    if (selectedBrands.length) r = r.filter((p) => selectedBrands.includes(p.manufacturer))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      r = r.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.partNumber.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q),
      )
    }
    if (inStockOnly) r = r.filter((p) => p.inStock)
    if (priceMin) r = r.filter((p) => p.price >= Number(priceMin))
    if (priceMax) r = r.filter((p) => p.price <= Number(priceMax))
    switch (sort) {
      case 'price-asc':  r.sort((a, b) => a.price - b.price); break
      case 'price-desc': r.sort((a, b) => b.price - a.price); break
      case 'name':       r.sort((a, b) => a.name.localeCompare(b.name, 'ru')); break
      case 'stock':      r.sort((a, b) => b.stockCount - a.stockCount); break
    }
    return r
  }, [products, selectedBrands, searchQuery, sort, inStockOnly, priceMin, priceMax])

  const hasFilters = !!(selectedBrands.length || inStockOnly || priceMin || priceMax)

  function togglePendingBrand(b: string) {
    setPendingBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b])
  }

  function resetAll() {
    setSelectedBrands([]); setInStockOnly(false)
    setPriceMin(''); setPriceMax(''); setSearchQuery('')
    setPendingBrands([]); setPendingInStock(false)
    setPendingPriceMin(''); setPendingPriceMax('')
  }

  const manufacturers = Array.from(new Set(products.map(p => p.manufacturer))).sort()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav categories={allCategories} totalProducts={totalProducts} />
      <main>
        {/* Breadcrumbs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-2">
            <nav className="flex items-center gap-1 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#0066cc] transition-colors">Главная</Link>
              <ChevronRight size={12} className="text-gray-300" />
              <Link href="/catalog" className="hover:text-[#0066cc] transition-colors">Каталог</Link>
              {parentCategory && (
                <>
                  <ChevronRight size={12} className="text-gray-300" />
                  <Link href={`/catalog/${parentCategory.slug}`} className="hover:text-[#0066cc] transition-colors">
                    {parentCategory.name}
                  </Link>
                </>
              )}
              <ChevronRight size={12} className="text-gray-300" />
              <span className="text-gray-900 font-medium">{category.name}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-4">
          {/* Header */}
          <div className="flex items-baseline gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
            <span className="text-sm text-gray-400">{formatNumber(filtered.length)} позиций</span>
          </div>

          {/* Subcategories (if level 1 category) */}
          {category.children && category.children.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {category.children.map((child) => (
                <Link
                  key={child.slug}
                  href={`/catalog/${child.slug}`}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#0066cc] hover:shadow-md transition-all group"
                >
                  <div className="flex size-10 items-center justify-center bg-[#e8f4ff] shrink-0 rounded">
                    <CategoryIcon slug={child.slug} size={24} className="text-[#0066cc]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-[#0066cc] transition-colors truncate">
                      {child.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="flex gap-5">
            {/* Sidebar Filters */}
            <aside className={`${filtersOpen ? 'fixed inset-0 z-50 flex' : 'hidden'} lg:relative lg:flex lg:inset-auto lg:z-auto flex-col w-[220px] shrink-0`}>
              {filtersOpen && <div className="fixed inset-0 bg-black/30 lg:hidden" onClick={() => setFiltersOpen(false)} />}
              <div className="relative z-10 w-[220px] bg-white border border-gray-200 rounded-lg shadow-[0_2px_12px_rgba(0,0,0,0.06)] max-h-[calc(100vh-80px)] overflow-y-auto ml-auto lg:ml-0">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Фильтры</span>
                  <button onClick={() => setFiltersOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-700 p-1">
                    <X size={14} />
                  </button>
                </div>
                <div className="px-3 py-2">
                  <FilterBlock title="ПРОИЗВОДИТЕЛЬ">
                    <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
                      {manufacturers.map((brand) => {
                        const count = products.filter((p) => p.manufacturer === brand).length
                        if (!count) return null
                        const checked = pendingBrands.includes(brand)
                        return (
                          <label key={brand} className="flex items-center gap-2.5 cursor-pointer py-1 group">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePendingBrand(brand)}
                              className="size-4 accent-[#0066cc] cursor-pointer shrink-0"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 transition-colors">{brand}</span>
                            <span className="text-xs text-gray-400 shrink-0">{count}</span>
                          </label>
                        )
                      })}
                    </div>
                  </FilterBlock>

                  <FilterBlock title="ТОВАРЫ В НАЛИЧИИ" open={false}>
                    <label className="flex items-center gap-2.5 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={pendingInStock}
                        onChange={(e) => setPendingInStock(e.target.checked)}
                        className="size-4 accent-[#0066cc] cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">Только в наличии</span>
                    </label>
                  </FilterBlock>

                  <FilterBlock title="ЦЕНА, ₽">
                    <div className="flex gap-2 mt-1">
                      <div className="flex-1">
                        <div className="text-[11px] text-gray-400 mb-1">Мин. цена</div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={pendingPriceMin}
                          onChange={(e) => setPendingPriceMin(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full h-9 px-2 text-sm border border-gray-300 text-gray-900 placeholder-gray-300 outline-none focus:border-[#0066cc] transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] text-gray-400 mb-1">Макс. цена</div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="∞"
                          value={pendingPriceMax}
                          onChange={(e) => setPendingPriceMax(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full h-9 px-2 text-sm border border-gray-300 text-gray-900 placeholder-gray-300 outline-none focus:border-[#0066cc] transition-colors"
                        />
                      </div>
                    </div>
                  </FilterBlock>

                  <div className="pt-4 space-y-2">
                    <button
                      onClick={applyFilters}
                      disabled={!hasPendingChanges}
                      className={`w-full h-12 text-sm font-bold text-white transition-all rounded ${
                        hasPendingChanges
                          ? 'bg-[#0066cc] hover:bg-[#0052a3] shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,102,204,0.25)]'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Применить фильтр
                    </button>
                    {hasFilters && (
                      <button onClick={resetAll}
                        className="w-full flex items-center justify-center gap-1.5 h-9 text-sm text-gray-500 border border-gray-300 hover:border-gray-400 hover:text-gray-700 transition-all">
                        <X size={12} /> Сбросить всё
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 border-b border-gray-200 pb-3">
                <button onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-8 px-3 text-sm text-gray-700 bg-white border border-gray-300 hover:border-gray-400 transition-all">
                  <SlidersHorizontal size={13} /> Фильтры
                  {hasFilters && <span className="flex size-4 items-center justify-center rounded-full bg-[#0066cc] text-white text-[10px] font-bold">{selectedBrands.length + (inStockOnly ? 1 : 0)}</span>}
                </button>

                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500 shrink-0">Сортировка:</span>
                  {sortOptions.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setSort(o.value)}
                      className={`px-2.5 py-1 text-sm transition-all ${
                        sort === o.value
                          ? 'bg-[#fff3cd] text-gray-900 font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <div className="relative">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск в группе"
                      className="h-8 w-48 px-3 pr-8 text-sm border border-gray-300 text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors" />
                    {searchQuery
                      ? <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X size={12} /></button>
                      : <Search size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    }
                  </div>

                  <div className="flex items-center gap-1 border border-gray-300 rounded">
                    <button onClick={() => setViewMode('list')}
                      className={`flex items-center justify-center size-8 transition-colors ${
                        viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                      <List size={16} />
                    </button>
                    <button onClick={() => setViewMode('grid')}
                      className={`flex items-center justify-center size-8 transition-colors ${
                        viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                      <Grid3X3 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">Товары не найдены</div>
                  <p className="text-sm text-gray-500">Попробуйте изменить фильтры или поисковый запрос</p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {filtered.map((p) => <ProductListRow key={p.id} product={p} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
