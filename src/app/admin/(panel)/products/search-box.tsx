'use client'

import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchBox({ initialQuery, filter }: { initialQuery: string; filter: string }) {
  const router = useRouter()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (filter) params.set('filter', filter)
        router.push(params.size ? `/admin/products?${params}` : '/admin/products')
      }}
      className="relative"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        name="q"
        defaultValue={initialQuery}
        placeholder="Поиск по артикулу или названию…"
        className="w-72 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
      />
    </form>
  )
}
