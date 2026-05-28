'use client'

import { useEffect, useState } from 'react'
import { GitCompareArrows, Check } from 'lucide-react'
import {
  type CompareItem,
  isInCompare,
  toggleCompare,
} from '@/lib/compare-store'

interface CompareToggleBtnProps {
  item: CompareItem
  variant?: 'icon' | 'full'
}

/**
 * Button to add/remove a product from the comparison list.
 * - `icon`: small square icon (good for product rows)
 * - `full`: full-width labelled button (good for product page)
 */
export function CompareToggleBtn({ item, variant = 'icon' }: CompareToggleBtnProps) {
  const [active, setActive] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // hydration from localStorage — required after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    setActive(isInCompare(item.id))
    function refresh() {
      setActive(isInCompare(item.id))
    }
    window.addEventListener('compare:change', refresh)
    return () => window.removeEventListener('compare:change', refresh)
  }, [item.id])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const result = toggleCompare(item)
    if (result === 'full') {
      // Silent: button stays unchanged when at COMPARE_LIMIT
      return
    }
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold rounded transition-all w-full ${
          active
            ? 'bg-[#e8f4ff] text-[#0066cc] border border-[#0066cc]/30'
            : 'bg-white text-gray-700 border border-gray-200 hover:border-[#0066cc] hover:text-[#0066cc]'
        }`}
        title={active ? 'Убрать из сравнения' : 'Добавить в сравнение'}
        aria-pressed={active}
        suppressHydrationWarning
      >
        {mounted && active ? <Check size={14} /> : <GitCompareArrows size={14} />}
        {mounted && active ? 'В сравнении' : 'Сравнить'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center w-7 h-7 rounded transition-all ${
        active
          ? 'bg-[#e8f4ff] text-[#0066cc]'
          : 'text-gray-400 hover:bg-gray-100 hover:text-[#0066cc]'
      }`}
      title={active ? 'Убрать из сравнения' : 'Добавить в сравнение'}
      aria-pressed={active}
      suppressHydrationWarning
    >
      {mounted && active ? <Check size={13} /> : <GitCompareArrows size={13} />}
    </button>
  )
}
