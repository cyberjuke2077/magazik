'use client'

import Link from 'next/link'
import { GitCompareArrows, X } from 'lucide-react'
import { useCompare } from '@/hooks/use-compare'
import { clearCompare, removeFromCompare } from '@/lib/compare-store'

/**
 * Floating bar at the bottom of the screen showing items added to compare.
 * Appears only when compare list is non-empty.
 */
export function CompareBar() {
  const { items, mounted, count } = useCompare()

  if (!mounted || count === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-20 z-[140] max-w-md sm:w-[380px] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-azure text-white">
        <div className="flex items-center gap-2">
          <GitCompareArrows size={16} />
          <span className="text-sm font-bold">Сравнение ({count}/4)</span>
        </div>
        <button
          onClick={() => clearCompare()}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Очистить"
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-3 space-y-1.5 max-h-[200px] overflow-y-auto">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
          >
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 truncate">{it.partNumber}</div>
              <div className="text-gray-500 truncate">{it.name}</div>
            </div>
            <button
              onClick={() => removeFromCompare(it.id)}
              className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Убрать"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <Link
          href="/compare"
          className="flex items-center justify-center gap-2 w-full h-10 text-sm font-semibold text-white bg-azure hover:bg-azure-hover rounded transition-all"
        >
          <GitCompareArrows size={14} />
          Открыть сравнение
        </Link>
      </div>
    </div>
  )
}
