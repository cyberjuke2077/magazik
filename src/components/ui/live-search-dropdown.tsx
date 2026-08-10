'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, ChevronRight, Package, Tag, Building2 } from 'lucide-react'

interface SearchProduct {
  id: string
  slug: string
  name: string
  partNumber: string
  manufacturer: string
  categorySlug: string
  categoryName: string
}

interface SearchCategory {
  id: string
  slug: string
  name: string
  productCount: number
}

interface SearchManufacturer {
  id: string
  slug: string
  name: string
  productCount: number
}

interface SearchResults {
  products: SearchProduct[]
  categories: SearchCategory[]
  manufacturers: SearchManufacturer[]
}

const HISTORY_KEY = 'electromagaz_search_history'
const MAX_HISTORY = 5

function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addToSearchHistory(query: string) {
  if (typeof window === 'undefined') return
  try {
    const history = getSearchHistory().filter((h) => h !== query)
    history.unshift(query)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch { /* ignore */ }
}

/**
 * Highlights matching parts of text with bold.
 */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="font-bold text-azure">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function SkeletonResults() {
  return (
    <div className="p-3 space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-200 rounded" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LiveSearchDropdown() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [history, setHistory] = useState<string[]>(getSearchHistory)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build flat list of navigable items for keyboard nav
  const navItems = useCallback((): Array<{ type: string; href: string; label: string }> => {
    if (!results) return []
    const items: Array<{ type: string; href: string; label: string }> = []

    results.products.forEach((p) => {
      items.push({ type: 'product', href: `/product/${p.slug}`, label: p.partNumber })
    })
    results.categories.forEach((c) => {
      items.push({ type: 'category', href: `/catalog?category=${c.slug}`, label: c.name })
    })
    results.manufacturers.forEach((m) => {
      items.push({ type: 'manufacturer', href: `/catalog?manufacturer=${m.slug}`, label: m.name })
    })

    return items
  }, [results])

  function handleSearch(searchQuery: string) {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (searchQuery.trim().length < 2) {
      setResults(null)
      setIsLoading(false)
      setActiveIndex(-1)
      return
    }

    setIsLoading(true)
    setActiveIndex(-1)

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
        const data = await res.json()
        setResults(data)
      } catch {
        setResults({ products: [], categories: [], manufacturers: [] })
      } finally {
        setIsLoading(false)
      }
    }, 250)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    addToSearchHistory(query.trim())
    setHistory(getSearchHistory())
    setResults(null)
    setIsFocused(false)
    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const items = navItems()
    const totalItems = items.length + (query.trim().length >= 2 ? 1 : 0) // +1 for "all results"

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      if (activeIndex < items.length) {
        const item = items[activeIndex]
        if (item.type === 'product') addToSearchHistory(item.label)
        router.push(item.href)
        setIsFocused(false)
        setResults(null)
      } else {
        // "All results" item
        handleSubmit(e as unknown as React.FormEvent)
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false)
      setResults(null)
      inputRef.current?.blur()
    }
  }

  function handleHistoryClick(term: string) {
    setQuery(term)
    handleSearch(term)
    inputRef.current?.focus()
  }

  function handleItemClick(href: string, label?: string) {
    if (label) addToSearchHistory(label)
    setHistory(getSearchHistory())
    setResults(null)
    setIsFocused(false)
    router.push(href)
  }

  const showDropdown = isFocused && (
    isLoading ||
    (results && (results.products.length > 0 || results.categories.length > 0 || results.manufacturers.length > 0)) ||
    (results && results.products.length === 0 && results.categories.length === 0 && results.manufacturers.length === 0 && query.trim().length >= 2) ||
    (query.trim().length < 2 && history.length > 0)
  )

  const noResults = results &&
    results.products.length === 0 &&
    results.categories.length === 0 &&
    results.manufacturers.length === 0 &&
    query.trim().length >= 2

  let currentNavIndex = 0

  return (
    <div className="flex-1 relative">
      <form onSubmit={handleSubmit} className="relative h-9 rounded-xl bg-[#f7f7f7] lg:h-14 lg:rounded-2xl">
        <input
          ref={inputRef}
          type="text"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            handleSearch(e.target.value)
          }}
          onFocus={() => {
            setIsFocused(true)
            if (query.length >= 2) handleSearch(query)
          }}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск по артикулу, названию или производителю"
          className="h-full w-full rounded-xl border border-transparent bg-transparent pl-4 pr-14 text-sm text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-azure focus:bg-white focus:ring-2 focus:ring-azure/10 lg:rounded-2xl lg:pl-5 lg:text-base"
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-white hover:text-azure lg:right-3 lg:size-11"
          aria-label="Найти"
        >
          <Search size={21} strokeWidth={1.7} />
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-[48px] z-[var(--layer-menu)] overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-xl)] lg:top-[64px]"
        >
          {/* Loading skeleton */}
          {isLoading && <SkeletonResults />}

          {/* No results */}
          {!isLoading && noResults && (
            <div className="px-4 py-8 text-center">
              <div className="text-gray-300 text-3xl mb-2">¯\_(ツ)_/¯</div>
              <p className="text-sm text-gray-500">
                Ничего не найдено по запросу «<span className="font-medium text-gray-700">{query}</span>»
              </p>
              <p className="text-xs text-gray-400 mt-1">Попробуйте изменить запрос или проверьте написание</p>
            </div>
          )}

          {/* History (when query is empty) */}
          {!isLoading && query.trim().length < 2 && history.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Недавние запросы
              </div>
              {history.map((term) => (
                <button
                  key={term}
                  onMouseDown={() => handleHistoryClick(term)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-azure-light rounded transition-colors"
                >
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {!isLoading && results && !noResults && (
            <div className="max-h-[420px] overflow-y-auto">
              {/* Products section */}
              {results.products.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                    <Package size={11} />
                    Товары
                  </div>
                  {results.products.map((product) => {
                    const idx = currentNavIndex++
                    return (
                      <button
                        key={product.id}
                        onMouseDown={() => handleItemClick(`/product/${product.slug}`, product.partNumber)}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                          activeIndex === idx ? 'bg-azure-light' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-azure-light shrink-0">
                          <Package size={14} className="text-azure" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            <HighlightMatch text={product.partNumber} query={query} />
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            <HighlightMatch text={product.name} query={query} />
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-400 shrink-0 text-right">
                          <div>{product.manufacturer}</div>
                          <div className="text-gray-300">{product.categoryName}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Categories section */}
              {results.categories.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                    <Tag size={11} />
                    Категории
                  </div>
                  {results.categories.map((cat) => {
                    const idx = currentNavIndex++
                    return (
                      <button
                        key={cat.id}
                        onMouseDown={() => handleItemClick(`/catalog?category=${cat.slug}`)}
                        className={`flex items-center gap-3 w-full px-4 py-2 text-left transition-colors ${
                          activeIndex === idx ? 'bg-azure-light' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Tag size={14} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 flex-1">
                          <HighlightMatch text={cat.name} query={query} />
                        </span>
                        <span className="text-xs text-gray-400">{cat.productCount} товаров</span>
                        <ChevronRight size={12} className="text-gray-300" />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Manufacturers section */}
              {results.manufacturers.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
                    <Building2 size={11} />
                    Производители
                  </div>
                  {results.manufacturers.map((mfr) => {
                    const idx = currentNavIndex++
                    return (
                      <button
                        key={mfr.id}
                        onMouseDown={() => handleItemClick(`/catalog?manufacturer=${mfr.slug}`)}
                        className={`flex items-center gap-3 w-full px-4 py-2 text-left transition-colors ${
                          activeIndex === idx ? 'bg-azure-light' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Building2 size={14} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 flex-1">
                          <HighlightMatch text={mfr.name} query={query} />
                        </span>
                        <span className="text-xs text-gray-400">{mfr.productCount} товаров</span>
                        <ChevronRight size={12} className="text-gray-300" />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* "All results" footer */}
              {query.trim().length >= 2 && results.products.length > 0 && (
                <button
                  onMouseDown={() => {
                    addToSearchHistory(query.trim())
                    handleItemClick(`/catalog?q=${encodeURIComponent(query.trim())}`)
                  }}
                  className={`flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-azure hover:bg-azure-light border-t border-gray-200 transition-colors ${
                    activeIndex === currentNavIndex ? 'bg-azure-light' : ''
                  }`}
                >
                  Все результаты по запросу «{query.trim()}»
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
