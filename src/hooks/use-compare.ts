'use client'

import { useEffect, useState } from 'react'
import { getCompareList, type CompareItem } from '@/lib/compare-store'

export function useCompare() {
  const [items, setItems] = useState<CompareItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
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
