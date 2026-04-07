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
import { categories, products } from '@/lib/mock-data'
import { formatPrice, formatNumber } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { type Product } from '@/types'

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name' | 'stock'
type ViewMode = 'grid' | 'list'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popular',    label: 'Рекомендуем' },
  { value: 'price-asc',  label: 'Дешевле' },
  { value: 'price-desc', label: 'Дороже' },
  { value: 'name',       label: 'По названию' },
  { value: 'stock',      label: 'Количество' },
]

const manufacturers = [
  'Yageo', 'Murata', 'STMicroelectronics', 'Infineon',
  'Texas Instruments', 'Espressif', 'Vishay', 'Analog Devices',
]

/* ── Collapsible filter block ── */
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

/* ── List row product card (chipdip style) ── */
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
      {/* Icon */}
      <Link href={`/product/${product.slug}`} className="flex size-16 items-center justify-center bg-[#e8f4ff] shrink-0">
        <CategoryIcon slug={product.categorySlug} size={36} className="text-[#0066cc] opacity-60 group-hover:opacity-90 transition-opacity" />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{product.manufacturer}</div>
        <Link href={`/product/${product.slug}`} className="text-sm font-semibold text-[#0066cc] hover:underline leading-snug line-clamp-2 block">
          {product.partNumber}, {product.name}
        </Link>
        <div className="text-xs text-gray-400 mt-0.5">Бренд: {product.manufacturer}</div>
      </div>

      {/* Stock */}
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

      {/* Price + stepper + cart */}
      <div className="shrink-0 flex items-center gap-3">
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</div>
          <div className="text-xs text-gray-400">× {inCart ? cartQty : qty} {product.unit}</div>
        </div>

        {/* Stepper */}
        <div className="flex items-center border border-gray-300 bg-white" onClick={(e) => e.preventDefault()}>
          <button
            onClick={(e) => { e.preventDefault(); inCart ? updateQuantity(product.id, Math.max(product.minOrder, cartQty - 1)) : setQty((q) => Math.max(product.minOrder, q - 1)) }}
            className="flex items-center justify-center w-7 h-9 text-gray-500 hover:bg-gray-100 transition-colors border-r border-gray-300"
          ><Minus size={11} /></button>
          <span className="w-9 text-center text-sm font-bold text-gray-900 select-none">
            {inCart ? cartQty : qty}
          </span>
          <button
            onClick={(e) => { e.preventDefault(); inCart ? updateQuantity(product.id, cartQty + 1) : setQty((q) => q + 1) }}
            className="flex items-center justify-center w-7 h-9 text-gray-500 hover:bg-gray-100 transition-colors border-l border-gray-300"
          ><Plus size={11} /></button>
        </div>

        {/* Cart button */}
        <button
          onClick={handleAdd}
          disabled={!product.inStock}
          className={`flex items-center gap-1.5 h-9 px-4 text-sm font-bold transition-all ${
            added
              ? 'bg-[#16a34a] text-white shadow-[0_4px_12px_rgba(22,163,74,0.3)]'
              : inCart
              ? 'bg-[#e8f4ff] text-[#0066cc] border border-[#0066cc]/30'
              : product.inStock
              ? 'bg-[#0066cc] text-white hover:bg-[#0066cc] shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,102,204,0.25)]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {added ? <><Check size={13} />Добавлено</> : inCart ? <><Check size={13} />В списке</> : <><ShoppingCart size={13} />В запрос</>}
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   SIDEBAR — отдельный компонент чтобы не терять фокус
   при ре-рендере родителя
══════════════════════════════════════════════════════ */
interface SidebarProps {
  pendingBrands: string[]
  pendingPriceMin: string
  pendingPriceMax: string
  pendingInStock: boolean
  hasPendingChanges: boolean
  hasFilters: boolean
  onToggleBrand: (b: string) => void
  onPriceMinChange: (v: string) => void
  onPriceMaxChange: (v: string) => void
  onInStockChange: (v: boolean) => void
  onApply: () => void
  onReset: () => void
}

function SidebarContent({
  pendingBrands, pendingPriceMin, pendingPriceMax, pendingInStock,
  hasPendingChanges, hasFilters,
  onToggleBrand, onPriceMinChange, onPriceMaxChange, onInStockChange,
  onApply, onReset,
}: SidebarProps) {
  return (
    <div>
      {/* ПРОИЗВОДИТЕЛЬ */}
      <FilterBlock title="ПРОИЗВОДИТЕЛЬ">
        <div className="relative mb-2">
          <input type="text" placeholder="Поиск значений"
            className="w-full h-8 px-2.5 text-sm border border-gray-300 text-gray-700 placeholder-gray-400 outline-none focus:border-[#0066cc] transition-colors" />
        </div>
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
                  onChange={() => onToggleBrand(brand)}
                  className="size-4 accent-[#0066cc] cursor-pointer shrink-0"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 transition-colors">{brand}</span>
                <span className="text-xs text-gray-400 shrink-0">{count}</span>
              </label>
            )
          })}
        </div>
      </FilterBlock>

      {/* ТОВАРЫ В НАЛИЧИИ */}
      <FilterBlock title="ТОВАРЫ В НАЛИЧИИ" open={false}>
        <label className="flex items-center gap-2.5 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={pendingInStock}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="size-4 accent-[#0066cc] cursor-pointer"
          />
          <span className="text-sm text-gray-700">Только в наличии</span>
        </label>
      </FilterBlock>

      {/* ЦЕНА */}
      <FilterBlock title="ЦЕНА, ₽">
        <div className="flex gap-2 mt-1">
          <div className="flex-1">
            <div className="text-[11px] text-gray-400 mb-1">Мин. цена</div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={pendingPriceMin}
              onChange={(e) => onPriceMinChange(e.target.value.replace(/[^0-9]/g, ''))}
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
              onChange={(e) => onPriceMaxChange(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full h-9 px-2 text-sm border border-gray-300 text-gray-900 placeholder-gray-300 outline-none focus:border-[#0066cc] transition-colors"
            />
          </div>
        </div>
      </FilterBlock>

      {/* Кнопки */}
      <div className="pt-4 space-y-2">
        <button
          onClick={onApply}
          disabled={!hasPendingChanges}
          className={`w-full h-12 text-sm font-bold text-white transition-all rounded ${
            hasPendingChanges
              ? 'bg-[#0066cc] hover:bg-[#0066cc] shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,102,204,0.25)]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Применить фильтр
        </button>
        {hasFilters && (
          <button onClick={onReset}
            className="w-full flex items-center justify-center gap-1.5 h-9 text-sm text-gray-500 border border-gray-300 hover:border-gray-400 hover:text-gray-700 transition-all">
            <X size={12} /> Сбросить всё
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   CATALOG PAGE
══════════════════════════════════════════════════════ */
export default function CatalogPage() {
  // ── Applied filters (used for actual filtering) ──
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)

  // ── Pending filters (edited in sidebar, not yet applied) ──
  const [pendingCategory, setPendingCategory] = useState<string | null>(null)
  const [pendingBrands, setPendingBrands] = useState<string[]>([])
  const [pendingPriceMin, setPendingPriceMin] = useState('')
  const [pendingPriceMax, setPendingPriceMax] = useState('')
  const [pendingInStock, setPendingInStock] = useState(false)

  // ── UI state ──
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('popular')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Есть ли несохранённые изменения
  const hasPendingChanges =
    pendingCategory !== selectedCategory ||
    JSON.stringify(pendingBrands) !== JSON.stringify(selectedBrands) ||
    pendingPriceMin !== priceMin ||
    pendingPriceMax !== priceMax ||
    pendingInStock !== inStockOnly

  function applyFilters() {
    setSelectedCategory(pendingCategory)
    setSelectedBrands(pendingBrands)
    setPriceMin(pendingPriceMin)
    setPriceMax(pendingPriceMax)
    setInStockOnly(pendingInStock)
    setFiltersOpen(false)
  }

  const filtered = useMemo(() => {
    let r = [...products]
    if (selectedCategory) r = r.filter((p) => p.categorySlug === selectedCategory)
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
  }, [selectedCategory, selectedBrands, searchQuery, sort, inStockOnly, priceMin, priceMax])

  const activeCategory = categories.find((c) => c.slug === selectedCategory)
  const hasFilters = !!(selectedCategory || selectedBrands.length || inStockOnly || priceMin || priceMax)

  function togglePendingBrand(b: string) {
    setPendingBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b])
  }

  function resetAll() {
    setSelectedCategory(null); setSelectedBrands([]); setInStockOnly(false)
    setPriceMin(''); setPriceMax(''); setSearchQuery('')
    setPendingCategory(null); setPendingBrands([]); setPendingInStock(false)
    setPendingPriceMin(''); setPendingPriceMax('')
  }



  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      <main>

        {/* Breadcrumb */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-2">
            <nav className="flex items-center gap-1 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#0066cc] transition-colors">Главная</Link>
              <ChevronRight size={12} className="text-gray-300" />
              <span className="text-gray-700">Каталог</span>
              {activeCategory && (
                <>
                  <ChevronRight size={12} className="text-gray-300" />
                  <span className="text-gray-900 font-medium">{activeCategory.name}</span>
                </>
              )}
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-4">

          {/* Page title */}
          <div className="flex items-baseline gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeCategory ? activeCategory.name : 'Каталог'}
            </h1>
            <span className="text-sm text-gray-400">{formatNumber(filtered.length)} позиций</span>
          </div>

          {/* Category quick-filter chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 text-sm border transition-all ${
                !selectedCategory
                  ? 'border-[#0066cc] text-[#0066cc] bg-[#e8f4ff] font-semibold'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              Все
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categorySlug === cat.slug).length
              if (!count) return null
              const active = selectedCategory === cat.slug
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(active ? null : cat.slug)}
                  className={`px-4 py-1.5 text-sm border transition-all ${
                    active
                      ? 'border-[#0066cc] text-[#0066cc] bg-[#e8f4ff] font-semibold'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>

          <div className="flex gap-5">

            {/* ── Sidebar ── */}
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
                  <SidebarContent
                    pendingBrands={pendingBrands}
                    pendingPriceMin={pendingPriceMin}
                    pendingPriceMax={pendingPriceMax}
                    pendingInStock={pendingInStock}
                    hasPendingChanges={hasPendingChanges}
                    hasFilters={hasFilters}
                    onToggleBrand={togglePendingBrand}
                    onPriceMinChange={setPendingPriceMin}
                    onPriceMaxChange={setPendingPriceMax}
                    onInStockChange={setPendingInStock}
                    onApply={applyFilters}
                    onReset={resetAll}
                  />
                </div>
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 min-w-0">

              {/* Toolbar — chipdip style */}
              <div className="flex items-center gap-3 mb-3 border-b border-gray-200 pb-3">
                {/* Mobile filter button */}
                <button onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-8 px-3 text-sm text-gray-700 bg-white border border-gray-300 hover:border-gray-400 transition-all">
                  <SlidersHorizontal size={13} /> Фильтры
                  {hasFilters && <span className="flex size-4 items-center justify-center rounded-full bg-[#0066cc] text-white text-[10px] font-bold">{selectedBrands.length + (selectedCategory ? 1 : 0) + (inStockOnly ? 1 : 0)}</span>}
                </button>

                {/* Sort — chipdip inline style */}
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

                {/* Search in group */}
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
                  <button className="h-8 px-4 text-sm font-semibold border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all">
                    Найти
                  </button>

                  {/* View toggle */}
                  <div className="flex items-center border border-gray-300">
                    <button onClick={() => setViewMode('list')}
                      className={`flex items-center justify-center size-8 transition-all ${viewMode === 'list' ? 'bg-[#0066cc] text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                      <List size={14} />
                    </button>
                    <button onClick={() => setViewMode('grid')}
                      className={`flex items-center justify-center size-8 border-l border-gray-300 transition-all ${viewMode === 'grid' ? 'bg-[#0066cc] text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                      <Grid3X3 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active filter tags */}
              {(selectedCategory || selectedBrands.length > 0 || inStockOnly) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {activeCategory && (
                    <button onClick={() => setSelectedCategory(null)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#0066cc] bg-[#e8f4ff] border border-[#0066cc]/30 hover:bg-[#dbeeff] transition-all">
                      {activeCategory.name} <X size={10} />
                    </button>
                  )}
                  {selectedBrands.map((b) => (
                    <button key={b} onClick={() => { setPendingBrands(prev => prev.filter(x => x !== b)); setSelectedBrands(prev => prev.filter(x => x !== b)) }}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-all">
                      {b} <X size={10} />
                    </button>
                  ))}
                  {inStockOnly && (
                    <button onClick={() => setInStockOnly(false)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#16a34a] bg-green-50 border border-green-200 hover:bg-green-100 transition-all">
                      В наличии <X size={10} />
                    </button>
                  )}
                </div>
              )}

              {/* Products */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="text-5xl mb-4 opacity-20">◆</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Ничего не найдено</h3>
                  <p className="text-sm text-gray-500 mb-5">Попробуйте изменить фильтры или поисковый запрос</p>
                  <button onClick={resetAll} className="h-9 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0066cc] transition-all">
                    Сбросить фильтры
                  </button>
                </div>
              ) : viewMode === 'list' ? (
                /* LIST VIEW — chipdip style */
                <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  {filtered.map((product) => (
                    <ProductListRow key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                /* GRID VIEW */
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-center gap-0 mt-8 border border-gray-200 w-fit mx-auto">
                  {[1, 2, 3, 4, 5].map((page) => (
                    <button key={page}
                      className={`flex items-center justify-center w-9 h-9 text-sm border-r border-gray-200 last:border-r-0 transition-all font-medium ${
                        page === 1
                          ? 'bg-[#0066cc] text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}>
                      {page}
                    </button>
                  ))}
                  <button className="flex items-center justify-center w-9 h-9 text-sm border-l border-gray-200 text-gray-400 hover:bg-gray-50">
                    <ChevronRight size={14} />
                  </button>
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
