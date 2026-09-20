'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export function SourcingMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
      const copy = scope.current?.querySelector('[data-sourcing-copy]')
      const panels = scope.current?.querySelector('[data-sourcing-panels]')
      const cards = scope.current?.querySelectorAll('[data-sourcing-card]')
      if (!copy || !panels || !cards) return
      gsap.fromTo(copy, { opacity: 0.55 }, { opacity: 1, scrollTrigger: { trigger: copy, start: 'top 95%', end: 'top 65%', scrub: true } })
      gsap.fromTo(cards, { x: (index) => index * -52, y: (index) => index * 28, rotation: (index) => index * -0.5 }, {
        x: 0, y: 0, rotation: 0, ease: 'none',
        scrollTrigger: { trigger: panels, start: 'top 95%', end: 'top 55%', scrub: 0.5 },
      })
    })
    return () => media.revert()
  }, { scope })
  return <div ref={scope}>{children}</div>
}
