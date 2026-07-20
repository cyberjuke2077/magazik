'use client'

import { useEffect, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

interface MobileFilterDrawerProps {
  children: React.ReactNode
}

export function MobileFilterDrawer({ children }: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      {/* Trigger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-3 text-sm font-medium text-ink-2 transition-colors hover:border-azure/40 lg:hidden"
      >
        <SlidersHorizontal size={14} />
        Фильтры
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[var(--layer-overlay)] bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-[var(--layer-overlay)] h-[100dvh] w-full bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
          <span className="text-sm font-bold text-ink">Фильтры</span>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-8 h-8 text-ink-4 hover:text-ink-3 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-56px)] overflow-y-auto p-4 pb-24">
          {children}
        </div>
      </div>
    </>
  )
}
