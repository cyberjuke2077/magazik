'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { List, Table2 } from 'lucide-react'

export function ViewToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'list'

  function handleChange(view: 'list' | 'table') {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'list') {
      params.delete('view')
    } else {
      params.set('view', view)
    }
    const qs = params.toString()
    router.replace(`/catalog${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="flex items-center h-8 border border-gray-200 rounded overflow-hidden">
      <button
        onClick={() => handleChange('list')}
        className={`flex items-center justify-center w-8 h-full transition-colors ${
          currentView === 'list'
            ? 'bg-[#0066cc] text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
        title="Список"
      >
        <List size={14} />
      </button>
      <button
        onClick={() => handleChange('table')}
        className={`flex items-center justify-center w-8 h-full border-l border-gray-200 transition-colors ${
          currentView === 'table'
            ? 'bg-[#0066cc] text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
        title="Таблица"
      >
        <Table2 size={14} />
      </button>
    </div>
  )
}
