'use client'

import { useEffect, useState } from 'react'
import { getCompareList, type CompareItem } from '@/lib/compare-store'

export function useCompare() {
  const [items, setItems] = useState<CompareItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // hydration from localStorage — required after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    setItems(getCompareList())

    function refresh() {
      setItems(getCompareList())
    }
    window.addEventListener('compare:change', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('compare:change', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return { items, count: items.length, mounted }
}
