'use client'

import { useEffect, useState } from 'react'
import { GitCompareArrows, Check } from 'lucide-react'
import {
  type CompareItem,
  isInCompare,
  toggleCompare,
} from '@/lib/compare-store'
import { useToast } from '@/components/ui/toast'

interface CompareToggleBtnProps {
  item: CompareItem
  variant?: 'icon' | 'compact' | 'full'
}

/**
 * Button to add/remove a product from the comparison list.
 * - `icon`: small square icon (good for product rows)
 * - `full`: full-width labelled button (good for product page)
 */
export function CompareToggleBtn({ item, variant = 'icon' }: CompareToggleBtnProps) {
  const [active, setActive] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

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
      toast('В сравнении уже 4 товара. Удалите один, чтобы добавить новый.', {
        variant: 'info',
        action: { label: 'Открыть сравнение', href: '/compare' },
      })
      return
    }
    if (result === 'added') {
      toast('Товар добавлен в сравнение', {
        action: { label: 'Сравнить', href: '/compare' },
      })
    }
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold rounded transition-all w-full ${
          active
            ? 'bg-azure-light text-azure border border-azure/30'
            : 'bg-white text-gray-700 border border-gray-200 hover:border-azure hover:text-azure'
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

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors ${
          active
            ? 'bg-azure-light text-azure'
            : 'bg-surface-muted text-ink-3 hover:bg-azure-light hover:text-azure'
        }`}
        title={active ? 'Убрать из сравнения' : 'Добавить в сравнение'}
        aria-pressed={active}
        suppressHydrationWarning
      >
        {mounted && active ? <Check size={12} /> : <GitCompareArrows size={12} />}
        {mounted && active ? 'В сравнении' : 'Сравнить'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center w-7 h-7 rounded transition-all ${
        active
          ? 'bg-azure-light text-azure'
          : 'text-gray-400 hover:bg-gray-100 hover:text-azure'
      }`}
      title={active ? 'Убрать из сравнения' : 'Добавить в сравнение'}
      aria-pressed={active}
      suppressHydrationWarning
    >
      {mounted && active ? <Check size={13} /> : <GitCompareArrows size={13} />}
    </button>
  )
}
