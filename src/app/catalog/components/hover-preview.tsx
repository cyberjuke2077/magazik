'use client'

import { useState, useRef, useCallback } from 'react'
import { FileText } from 'lucide-react'

interface HoverPreviewProps {
  product: {
    name: string
    description?: string
    specs: Record<string, string>
    datasheets?: Array<{ title: string; url: string }>
    package?: string | null
  }
  children: React.ReactNode
}

export function HoverPreview({ product, children }: HoverPreviewProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const specEntries = Object.entries(product.specs).slice(0, 4)
  const hasContent = product.description || specEntries.length > 0

  const handleMouseEnter = useCallback(() => {
    if (!hasContent) return
    timerRef.current = setTimeout(() => {
      setVisible(true)
    }, 500)
  }, [hasContent])

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setVisible(false)
  }, [])

  if (!hasContent) {
    return <>{children}</>
  }

  return (
    <div
      className="relative group/preview"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {visible && (
        <div className="absolute right-0 top-full mt-1 z-30 w-[320px] max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg p-4 pointer-events-none lg:top-1/2 lg:-translate-y-1/2 lg:left-full lg:ml-2 lg:mt-0">
          {/* Description */}
          {product.description && (
            <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Specs */}
          {specEntries.length > 0 && (
            <div className="space-y-1 mb-2">
              {specEntries.map(([key, value]) => (
                <div key={key} className="flex items-baseline gap-2 text-xs">
                  <span className="text-gray-400 shrink-0">{key}:</span>
                  <span className="text-gray-700 truncate">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Package */}
          {product.package && (
            <div className="text-xs text-gray-400 mb-2">
              Корпус: <span className="text-gray-600">{product.package}</span>
            </div>
          )}

          {/* Datasheet link */}
          {product.datasheets && product.datasheets.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#0066cc]">
              <FileText size={12} />
              <span>{product.datasheets[0].title || 'Datasheet'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
