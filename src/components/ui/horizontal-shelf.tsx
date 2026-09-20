'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function useShelfScroll() {
  const track = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  useEffect(() => {
    const element = track.current
    if (!element) return
    const update = () => setEdges({
      start: element.scrollLeft < 2,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
    })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    element.addEventListener('scroll', update, { passive: true })
    update()
    return () => { observer.disconnect(); element.removeEventListener('scroll', update) }
  }, [])

  function scroll(direction: number) {
    const element = track.current
    if (!element) return
    element.scrollBy({ left: direction * element.clientWidth * 0.8,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return { track, edges, scroll }
}

/** One row at every width, with mouse, touch and keyboard access. */
export function HorizontalShelf({ children, label, className }: {
  children: ReactNode
  label: string
  className: string
}) {
  const { track, edges, scroll } = useShelfScroll()

  return (
    <div className="relative">
      <div ref={track} aria-label={label} className={`no-scrollbar overflow-x-auto overscroll-x-contain ${className}`}>
        {children}
      </div>
      {([-1, 1] as const).map((direction) => {
        const disabled = direction === -1 ? edges.start : edges.end
        const Icon = direction === -1 ? ChevronLeft : ChevronRight
        return <button key={direction} type="button" disabled={disabled}
          onClick={() => scroll(direction)} aria-label={`${label}: ${direction === -1 ? 'назад' : 'дальше'}`}
          className={`absolute top-1/2 z-20 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/8 bg-white text-ink shadow-sm transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-azure disabled:invisible lg:flex ${direction === -1 ? '-left-3' : '-right-3'}`}>
          <Icon size={18} />
        </button>
      })}
    </div>
  )
}
