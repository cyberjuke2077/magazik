'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  /** Target value to count up to */
  value: number
  /** Animation duration in milliseconds */
  duration?: number
  /** Optional suffix (e.g. "+", "k", "млн") */
  suffix?: string
  /** Optional prefix */
  prefix?: string
  /** Format value with thousands separator (ru-RU locale) */
  format?: boolean
}

/**
 * Counter that animates from 0 to `value` once the element enters the viewport.
 * Uses easeOutExpo for a nice deceleration.
 */
export function AnimatedCounter({
  value,
  duration = 1800,
  suffix = '',
  prefix = '',
  format = true,
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0)
  const [started, setStarted] = useState(false)
  const elRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return

    const startTime = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCurrent(Math.round(value * eased))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setCurrent(value)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, value, duration])

  const display = format ? current.toLocaleString('ru-RU') : String(current)

  return (
    <span ref={elRef}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
