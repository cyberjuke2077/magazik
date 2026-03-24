'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Zap, Clock } from 'lucide-react'
import { products } from '@/lib/mock-data'

const popularSearches = [
  'STM32F103', 'ESP32', 'Arduino Nano', 'LM358', 'IRF540',
  'WS2812B', 'DS18B20', 'PC817', 'резистор 10к', 'конденсатор 100нФ',
]

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<typeof products>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const filtered = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.partNumber.toLowerCase().includes(q) ||
          p.manufacturer.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 5)
    setResults(filtered)
  }, [query])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`)
    setFocused(false)
  }

  function handlePopular(term: string) {
    setQuery(term)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch}>
        <div
          className={`relative flex items-center rounded-2xl border transition-all duration-300 ${
            focused
              ? 'border-[#22d3ee]/40 shadow-[0_0_0_4px_rgba(34,211,238,0.08)] bg-[#0d0f1e]'
              : 'border-white/10 bg-[#0d0f1e]/80 hover:border-white/15'
          }`}
        >
          <Search
            size={18}
            className={`absolute left-4 transition-colors ${focused ? 'text-[#22d3ee]' : 'text-[#64748b]'}`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Артикул, наименование или производитель..."
            className="w-full h-14 pl-12 pr-32 text-base bg-transparent text-[#f1f5f9] placeholder-[#64748b] outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-2 flex items-center gap-2 h-10 px-4 text-sm font-medium text-[#07080f] bg-[#22d3ee] hover:bg-[#22d3ee]/90 rounded-xl transition-all btn-primary"
          >
            Найти
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {focused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0f1e] border border-white/8 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {results.length > 0 ? (
            <>
              <div className="px-4 py-2 border-b border-white/5">
                <span className="text-xs text-[#64748b] uppercase tracking-wider">Результаты</span>
              </div>
              {results.map((product) => (
                <a
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors"
                >
                  <div className="flex items-center justify-center size-8 rounded-lg bg-[#111427] font-mono text-sm text-[#22d3ee] shrink-0">
                    {product.partNumber.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#f1f5f9] truncate">{product.name}</div>
                    <div className="text-xs text-[#64748b]">
                      {product.partNumber} · {product.manufacturer}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[#22d3ee] shrink-0">
                    {product.price.toFixed(2)} ₽
                  </div>
                </a>
              ))}
              <a
                href={`/catalog?q=${encodeURIComponent(query)}`}
                className="flex items-center justify-center gap-2 py-3 text-sm text-[#22d3ee] hover:bg-[#22d3ee]/5 border-t border-white/5 transition-colors"
              >
                Показать все результаты
                <ArrowRight size={13} />
              </a>
            </>
          ) : (
            <>
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2 text-xs text-[#64748b] uppercase tracking-wider mb-3">
                  <Zap size={10} className="text-[#22d3ee]" />
                  Популярные запросы
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handlePopular(term)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#94a3b8] bg-[#111427] hover:bg-[#161a33] hover:text-[#22d3ee] rounded-lg border border-white/6 hover:border-[#22d3ee]/20 transition-all"
                    >
                      <Clock size={9} className="opacity-50" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-white/5 mt-2">
                <p className="text-xs text-[#64748b]">
                  Введите артикул или наименование для поиска в 500,000+ позициях
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
