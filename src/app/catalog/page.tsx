'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, Grid3X3, List, Search, X, ChevronDown } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { categories, products } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'По популярности' },
  { value: 'price-asc', label: 'Цена: сначала дешевле' },
  { value: 'price-desc', label: 'Цена: сначала дороже' },
  { value: 'name', label: 'По названию' },
]

export default function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('popular')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    let result = [...products]

    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.partNumber.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q),
      )
    }
    if (inStockOnly) {
      result = result.filter((p) => p.inStock)
    }

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        break
    }

    return result
  }, [selectedCategory, searchQuery, sort, inStockOnly])

  const activeCategory = categories.find((c) => c.slug === selectedCategory)

  return (
    <>
      <Header />

      <main className="flex-1 bg-[#07080f]">
        {/* Page header */}
        <div className="border-b border-white/5 bg-[#07080f]">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <nav className="flex items-center gap-2 text-xs text-[#64748b] mb-3">
              <a href="/" className="hover:text-[#94a3b8] transition-colors">Главная</a>
              <span>/</span>
              <span className="text-[#94a3b8]">Каталог</span>
              {activeCategory && (
                <>
                  <span>/</span>
                  <span className="text-[#f1f5f9]">{activeCategory.name}</span>
                </>
              )}
            </nav>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#f1f5f9]">
                  {activeCategory ? activeCategory.name : 'Каталог'}
                </h1>
                <p className="text-sm text-[#64748b] mt-0.5">
                  {formatNumber(filtered.length)} позиций
                  {activeCategory && ` · ${activeCategory.description}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex gap-6">
            {/* ── Sidebar filters ── */}
            <aside
              className={`${
                filtersOpen ? 'fixed inset-0 z-50 flex' : 'hidden'
              } lg:relative lg:flex lg:inset-auto lg:z-auto flex-col w-64 shrink-0`}
            >
              {/* Mobile overlay */}
              {filtersOpen && (
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden"
                  onClick={() => setFiltersOpen(false)}
                />
              )}

              <div className="relative z-10 w-64 bg-[#0d0f1e] lg:bg-transparent border border-white/6 lg:border-transparent rounded-xl lg:rounded-none p-4 lg:p-0 max-h-screen overflow-y-auto ml-auto lg:ml-0">
                <div className="flex items-center justify-between mb-4 lg:mb-0">
                  <span className="text-sm font-semibold text-[#f1f5f9]">Фильтры</span>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="lg:hidden text-[#64748b] hover:text-[#f1f5f9]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Category filter */}
                <div className="space-y-1 lg:pt-0">
                  <div className="text-xs text-[#64748b] uppercase tracking-wider mb-2 lg:mb-3 lg:mt-0">
                    Категория
                  </div>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === null
                        ? 'bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20'
                        : 'text-[#94a3b8] hover:bg-white/4 hover:text-[#f1f5f9]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs opacity-60">◆</span>
                      Все категории
                    </span>
                    <span className="text-xs text-[#64748b]">{products.length}</span>
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.categorySlug === cat.slug).length
                    if (count === 0) return null
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => setSelectedCategory(cat.slug === selectedCategory ? null : cat.slug)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedCategory === cat.slug
                            ? 'bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20'
                            : 'text-[#94a3b8] hover:bg-white/4 hover:text-[#f1f5f9]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs opacity-60">{cat.icon}</span>
                          {cat.name}
                        </span>
                        <span className="text-xs text-[#64748b]">{count}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Availability filter */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="text-xs text-[#64748b] uppercase tracking-wider mb-3">Наличие</div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={`relative size-4 rounded border transition-all ${
                        inStockOnly
                          ? 'bg-[#22d3ee] border-[#22d3ee]'
                          : 'bg-transparent border-white/20 group-hover:border-white/40'
                      }`}
                    >
                      {inStockOnly && (
                        <svg className="absolute inset-0 m-auto" width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L4 7L9 1" stroke="#07080f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <span className="text-sm text-[#94a3b8] group-hover:text-[#f1f5f9] transition-colors">
                      Только в наличии
                    </span>
                  </label>
                </div>

                {/* Reset */}
                {(selectedCategory || inStockOnly || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setInStockOnly(false)
                      setSearchQuery('')
                    }}
                    className="mt-6 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-[#64748b] hover:text-[#94a3b8] border border-white/8 hover:border-white/15 rounded-lg transition-all"
                  >
                    <X size={12} />
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center gap-3 mb-5">
                {/* Mobile filter button */}
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-9 px-3 text-sm text-[#94a3b8] bg-[#0d0f1e] border border-white/6 hover:border-white/12 rounded-lg transition-all"
                >
                  <SlidersHorizontal size={14} />
                  Фильтры
                </button>

                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по каталогу..."
                    className="w-full h-9 pl-8 pr-4 text-sm bg-[#0d0f1e] border border-white/6 rounded-lg text-[#f1f5f9] placeholder-[#64748b] outline-none focus:border-[#22d3ee]/40 focus:ring-2 focus:ring-[#22d3ee]/10 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#f1f5f9]"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="appearance-none h-9 pl-3 pr-8 text-sm bg-[#0d0f1e] border border-white/6 rounded-lg text-[#94a3b8] outline-none focus:border-[#22d3ee]/40 transition-all cursor-pointer"
                    >
                      {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
                  </div>

                  {/* View toggle */}
                  <div className="hidden sm:flex items-center bg-[#0d0f1e] border border-white/6 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center justify-center size-8 rounded-md transition-all ${
                        viewMode === 'grid' ? 'bg-[#22d3ee]/10 text-[#22d3ee]' : 'text-[#64748b] hover:text-[#94a3b8]'
                      }`}
                    >
                      <Grid3X3 size={14} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center justify-center size-8 rounded-md transition-all ${
                        viewMode === 'list' ? 'bg-[#22d3ee]/10 text-[#22d3ee]' : 'text-[#64748b] hover:text-[#94a3b8]'
                      }`}
                    >
                      <List size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active filters */}
              {(selectedCategory || inStockOnly) && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-xs text-[#64748b]">Фильтры:</span>
                  {activeCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-[#22d3ee] bg-[#22d3ee]/10 border border-[#22d3ee]/20 rounded-lg hover:bg-[#22d3ee]/15 transition-all"
                    >
                      {activeCategory.name}
                      <X size={10} />
                    </button>
                  )}
                  {inStockOnly && (
                    <button
                      onClick={() => setInStockOnly(false)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 rounded-lg hover:bg-[#34d399]/15 transition-all"
                    >
                      В наличии
                      <X size={10} />
                    </button>
                  )}
                </div>
              )}

              {/* Products grid */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl mb-4 opacity-20">◆</div>
                  <h3 className="text-lg font-semibold text-[#f1f5f9] mb-2">Ничего не найдено</h3>
                  <p className="text-sm text-[#64748b]">
                    Попробуйте изменить фильтры или поисковый запрос
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                      : 'flex flex-col gap-3'
                  }
                >
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination placeholder */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-center gap-1 mt-8">
                  {[1, 2, 3, '...', 42].map((page, i) => (
                    <button
                      key={i}
                      className={`flex items-center justify-center size-9 text-sm rounded-lg transition-all ${
                        page === 1
                          ? 'bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/20'
                          : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-white/4'
                      }`}
                    >
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
