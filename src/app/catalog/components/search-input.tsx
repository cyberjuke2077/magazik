'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [value, setValue] = useState(initialQuery)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with URL when searchParams change externally
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(searchParams.get('q') || '')
  }, [searchParams])

  const updateUrl = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }
    // Reset to page 1 on new search
    params.delete('page')
    router.replace(`/catalog?${params.toString()}`)
  }, [router, searchParams])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setValue(newValue)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      updateUrl(newValue)
    }, 300)
  }

  function handleClear() {
    setValue('')
    if (timerRef.current) clearTimeout(timerRef.current)
    updateUrl('')
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Поиск по каталогу..."
        className="h-9 w-64 pl-9 pr-8 text-sm rounded-[var(--radius-control)] border border-[var(--border-2)] text-ink placeholder:text-ink-4 outline-none focus:border-azure transition-colors"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink-2"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
