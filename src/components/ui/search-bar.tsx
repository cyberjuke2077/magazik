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
          className={`relative flex items-center rounded border transition-all duration-300 ${
            focused
              ? 'border-[#0066cc]/40 shadow-[0_0_0_4px_rgba(0,102,204,0.08)] bg-white'
              : 'border-black/10 bg-white hover:border-black/15 shadow-sm'
          }`}
        >
          <Search
            size={18}
            className={`absolute left-4 transition-colors ${focused ? 'text-[#0066cc]' : 'text-[#a8a29e]'}`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Артикул, наименование или производитель..."
            className="w-full h-14 pl-12 pr-32 text-base bg-transparent text-[#1c1917] placeholder-[#a8a29e] outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute right-2 flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-all shadow-sm"
          >
            Найти
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      {/* Dropdown — popular searches */}
      {focused && !query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/8 rounded shadow-xl shadow-black/10 overflow-hidden z-50">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 text-xs text-[#a8a29e] uppercase tracking-wider mb-3">
              <Zap size={10} className="text-[#0066cc]" />
              Популярные запросы
            </div>
            <div className="flex flex-wrap gap-1.5">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onMouseDown={() => handlePopular(term)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#44403c] bg-[#e8f4ff] hover:bg-[#e0f2fe] hover:text-[#0066cc] rounded border border-black/6 hover:border-[#0066cc]/20 transition-all"
                >
                  <Clock size={9} className="opacity-50" />
                  {term}
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-black/6 mt-2">
            <p className="text-xs text-[#a8a29e]">
              Введите артикул или наименование для поиска в каталоге
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
