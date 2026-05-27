'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Top progress bar for Next.js App Router page transitions.
 * Shows a thin animated bar when route changes.
 */
export function NavProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(false)

  useEffect(() => {
    let mounted = true
    let tick: ReturnType<typeof setTimeout> | null = null
    let finishTick: ReturnType<typeof setTimeout> | null = null

    setActive(true)
    setProgress(15)

    const advance = () => {
      if (!mounted) return
      setProgress((p) => {
        if (p >= 90) return p
        const inc = (90 - p) * 0.15
        return Math.min(90, p + inc)
      })
      tick = setTimeout(advance, 200)
    }
    tick = setTimeout(advance, 200)

    // Complete shortly after; pathname/searchParams change indicates navigation finished
    finishTick = setTimeout(() => {
      if (!mounted) return
      setProgress(100)
      setTimeout(() => {
        if (!mounted) return
        setActive(false)
        setProgress(0)
      }, 250)
    }, 300)

    return () => {
      mounted = false
      if (tick) clearTimeout(tick)
      if (finishTick) clearTimeout(finishTick)
    }
  }, [pathname, searchParams])

  if (!active) return null

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[300] h-[2px] pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-[#0066cc] via-[#0ea5e9] to-[#0066cc] transition-[width] duration-200 ease-out shadow-[0_0_8px_rgba(0,102,204,0.6)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
