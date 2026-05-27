'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

interface MobileFilterDrawerProps {
  children: React.ReactNode
}

export function MobileFilterDrawer({ children }: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger button — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-4 text-sm font-medium text-gray-700 border border-gray-200 rounded hover:border-gray-300 transition-colors lg:hidden"
      >
        <SlidersHorizontal size={14} />
        Фильтры
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[280px] bg-white shadow-xl transform transition-transform duration-200 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-4 border-b border-gray-200">
          <span className="text-sm font-bold text-gray-900">Фильтры</span>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-48px)] p-4">
          {children}
        </div>
      </div>
    </>
  )
}
