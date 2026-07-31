'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Zap, Clock } from 'lucide-react'

const popularSearches = [
  'STM32F103', 'ESP32', 'MAX232', 'LM358', 'IRF540',
  'AT24C08', 'TPS2031', 'ADAU1701', 'резистор 10к', 'конденсатор 100нФ',
]

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`)
    setFocused(false)
  }

  function handlePopular(term: string) {
    router.push(`/catalog?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch}>
        <div
          className={`relative flex items-center rounded-[var(--radius-control)] border bg-white transition-colors duration-200 ${
            focused
              ? 'border-azure'
              : 'border-[var(--border-2)] hover:border-ink-4'
          }`}
        >
          <Search
            size={18}
            className={`absolute left-4 transition-colors ${focused ? 'text-azure' : 'text-ink-4'}`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Артикул, наименование или производитель..."
            className="h-14 w-full bg-transparent pl-12 pr-32 text-base text-ink outline-none placeholder:text-ink-4"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-2 flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-azure px-4 text-sm font-semibold text-white transition-colors hover:bg-azure-hover"
          >
            Найти
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Dropdown - popular searches */}
      {focused && !query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]">
          <div className="px-4 pt-4 pb-2">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink-3">
              <Zap size={10} className="text-azure" />
              Популярные запросы
            </div>
            <div className="flex flex-wrap gap-1.5">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onMouseDown={() => handlePopular(term)}
                  className="flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-azure/30 hover:text-azure"
                >
                  <Clock size={9} className="opacity-50" />
                  {term}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-black/6 mt-2">
            <p className="text-xs text-ink-4">
              Введите артикул или наименование для поиска в каталоге
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
