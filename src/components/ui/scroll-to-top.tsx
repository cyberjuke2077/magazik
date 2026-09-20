'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleClick() {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Прокрутить вверх"
      className={`fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-4 z-[var(--layer-sticky)] lg:bottom-6 lg:right-6 flex items-center justify-center size-11 rounded-full bg-azure text-white shadow-lg hover:bg-azure-hover hover:scale-110 transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp size={18} />
    </button>
  )
}
