'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, Grid3X3, List, Search, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { categories, products } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popular',    label: 'По популярности' },
  { value: 'price-asc',  label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'name',       label: 'По названию' },
]

const manufacturers = [
  'Yageo', 'Murata', 'STMicroelectronics', 'Infineon',
  'Texas Instruments', 'Espressif', 'Vishay', 'Analog Devices',
]

function FilterBlock({ title, children, open: defaultOpen = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className="text-sm font-bold text-gray-800">{title}</span>
        {open
          ? <ChevronUp size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          : <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        }
      </button>
      {open && <div className="animate-fade-up">{children}</div>}
    </div>
  )
}

export default function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('popular')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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
    }
    return r
  }, [selectedCategory, selectedBrands, searchQuery, sort, inStockOnly, priceMin, priceMax])

  const activeCategory = categories.find((c) => c.slug === selectedCategory)
  const hasFilters = !!(selectedCategory || selectedBrands.length || inStockOnly || priceMin || priceMax)

  function toggleBrand(b: string) {
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b])
  }

  function resetAll() {
    setSelectedCategory(null); setSelectedBrands([]); setInStockOnly(false)
    setPriceMin(''); setPriceMax(''); setSearchQuery('')
  }

  const SidebarContent = () => (
    <div>
      <FilterBlock title="Категория">
        <div className="space-y-0.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
              !selectedCategory ? 'bg-[#f0fdf4] text-[#166534] font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>Все категории</span>
            <span className="text-xs text-gray-400">{products.length}</span>
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.categorySlug === cat.slug).length
            if (!count) return null
            const active = selectedCategory === cat.slug
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(active ? null : cat.slug)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
                  active ? 'bg-[#f0fdf4] text-[#166534] font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs opacity-60">{cat.icon}</span>
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400">{count}</span>
              </button>
            )
          })}
        </div>
      </FilterBlock>

      <FilterBlock title="Производитель">
        <div className="space-y-2">
          {manufacturers.map((brand) => {
            const count = products.filter((p) => p.manufacturer === brand).length
            if (!count) return null
            const checked = selectedBrands.includes(brand)
            return (
              <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`relative size-4 rounded border-2 transition-all shrink-0 ${
                  checked ? 'bg-[#166534] border-[#166534]' : 'border-gray-300 group-hover:border-[#166534]'
                }`}>
                  {checked && (
                    <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <input type="checkbox" checked={checked} onChange={() => toggleBrand(brand)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 transition-colors">{brand}</span>
                <span className="text-xs text-gray-400">{count}</span>
              </label>
            )
          })}
        </div>
      </FilterBlock>

      <FilterBlock title="Цена, ₽">
        <div className="flex items-center gap-2">
          <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="От"
            className="w-full h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 transition-all" />
          <span className="text-gray-400 shrink-0 text-sm">—</span>
          <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="До"
            className="w-full h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 transition-all" />
        </div>
      </FilterBlock>

      <FilterBlock title="Наличие">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div className={`relative size-4 rounded border-2 transition-all shrink-0 ${
            inStockOnly ? 'bg-[#166534] border-[#166534]' : 'border-gray-300 group-hover:border-[#166534]'
          }`}>
            {inStockOnly && (
              <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Только в наличии</span>
        </label>
      </FilterBlock>

      {hasFilters && (
        <button onClick={resetAll}
          className="w-full flex items-center justify-center gap-1.5 h-9 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] rounded-xl transition-all mt-2">
          <X size={13} /> Сбросить фильтры
        </button>
      )}
    </div>
  )

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">

        {/* Breadcrumb */}
        <div className="border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <nav className="flex items-center gap-2 text-xs text-gray-400">
              <a href="/" className="hover:text-gray-600 transition-colors">Главная</a>
              <span>/</span>
              <span className="text-gray-600">Каталог</span>
              {activeCategory && <><span>/</span><span className="text-gray-900 font-medium">{activeCategory.name}</span></>}
            </nav>
            <span className="text-xs text-gray-400">{formatNumber(filtered.length)} позиций</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex gap-6">

            {/* ── Sidebar ── */}
            <aside className={`${filtersOpen ? 'fixed inset-0 z-50 flex' : 'hidden'} lg:relative lg:flex lg:inset-auto lg:z-auto flex-col w-56 shrink-0`}>
              {filtersOpen && <div className="fixed inset-0 bg-black/30 lg:hidden" onClick={() => setFiltersOpen(false)} />}
              <div className="relative z-10 w-56 bg-white border border-gray-100 rounded-2xl p-4 shadow-lg lg:shadow-sm max-h-[calc(100vh-80px)] overflow-y-auto ml-auto lg:ml-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-gray-900">Фильтры</span>
                  <button onClick={() => setFiltersOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-700 p-1">
                    <X size={15} />
                  </button>
                </div>
                <SidebarContent />
              </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex-1 min-w-0">

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <button onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all shadow-sm">
                  <SlidersHorizontal size={14} /> Фильтры
                  {hasFilters && <span className="flex size-4 items-center justify-center rounded-full bg-[#166534] text-white text-[10px] font-bold">{selectedBrands.length + (selectedCategory ? 1 : 0) + (inStockOnly ? 1 : 0)}</span>}
                </button>

                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Поиск по каталогу..."
                    className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 transition-all" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <div className="relative">
                    <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}
                      className="appearance-none h-9 pl-3 pr-8 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-[#166534] cursor-pointer shadow-sm">
                      {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-0.5">
                    <button onClick={() => setViewMode('grid')}
                      className={`flex items-center justify-center size-8 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#166534] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      <Grid3X3 size={14} />
                    </button>
                    <button onClick={() => setViewMode('list')}
                      className={`flex items-center justify-center size-8 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#166534] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                      <List size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active filter tags */}
              {(selectedCategory || selectedBrands.length > 0 || inStockOnly) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeCategory && (
                    <button onClick={() => setSelectedCategory(null)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#166534] bg-[#f0fdf4] border border-[#166534]/20 rounded-full hover:bg-[#dcfce7] transition-all">
                      {activeCategory.name} <X size={10} />
                    </button>
                  )}
                  {selectedBrands.map((b) => (
                    <button key={b} onClick={() => toggleBrand(b)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#f97316] bg-orange-50 border border-orange-200 rounded-full hover:bg-orange-100 transition-all">
                      {b} <X size={10} />
                    </button>
                  ))}
                  {inStockOnly && (
                    <button onClick={() => setInStockOnly(false)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#166534] bg-[#f0fdf4] border border-[#166534]/20 rounded-full hover:bg-[#dcfce7] transition-all">
                      В наличии <X size={10} />
                    </button>
                  )}
                </div>
              )}

              {/* Grid */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="text-5xl mb-4 opacity-20">◆</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Ничего не найдено</h3>
                  <p className="text-sm text-gray-500 mb-5">Попробуйте изменить фильтры или поисковый запрос</p>
                  <button onClick={resetAll} className="h-10 px-6 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] rounded-xl transition-all">
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4'
                  : 'flex flex-col gap-3'
                }>
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-center gap-1 mt-8">
                  {[1, 2, 3, '...', 42].map((page, i) => (
                    <button key={i}
                      className={`flex items-center justify-center size-9 text-sm rounded-xl transition-all font-medium ${
                        page === 1
                          ? 'bg-[#166534] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                      }`}>
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
