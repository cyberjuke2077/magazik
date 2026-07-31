'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePathname } from 'next/navigation'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger)
}

function revealElements() {
  gsap.utils.toArray<HTMLElement>('[data-motion-reveal]').forEach((element) => {
    gsap.fromTo(element, { autoAlpha: 0, y: 10 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.42,
      ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 92%', once: true },
    })
  })
}

function scaleElements() {
  gsap.utils.toArray<HTMLElement>('[data-motion-scale]').forEach((element) => {
    gsap.fromTo(element, { autoAlpha: 0.86, scale: 0.985 }, {
      autoAlpha: 1,
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top 96%',
        end: 'center 64%',
        scrub: 0.7,
      },
    })
  })
}

function scrubText() {
  gsap.utils.toArray<HTMLElement>('[data-motion-scrub]').forEach((element) => {
    const words = element.querySelectorAll('[data-motion-word]')
    if (words.length === 0) return

    gsap.fromTo(words, { opacity: 0.16 }, {
      opacity: 1,
      stagger: 0.08,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top 88%',
        end: 'bottom 62%',
        scrub: true,
      },
    })
  })
}

export function StorefrontMotion() {
  const pathname = usePathname()

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let motionContext: gsap.Context | undefined
    const timer = window.setTimeout(() => {
      motionContext = gsap.context(() => {
        revealElements()
        scaleElements()
        scrubText()
      })
      ScrollTrigger.refresh()
    }, 350)

    return () => {
      window.clearTimeout(timer)
      motionContext?.revert()
    }
  }, { dependencies: [pathname], revertOnUpdate: true })

  return null
}
