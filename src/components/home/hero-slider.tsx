'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const AUTOPLAY_DELAY_MS = 6000

const slides = [
  {
    image: '/storefront/hero-components.jpg',
    href: '/catalog',
    alt: 'Катушки с электронными компонентами и платы для серийного производства',
    eyebrow: 'Поставка электронных компонентов',
    title: 'Найдём компонент по точному MPN',
    description: 'Проверяем наличие, сроки поставки и документацию для разработки и серийного производства.',
  },
  {
    image: '/storefront/hero-xilinx.jpg',
    href: '/brands#brand-xilinx',
    alt: 'FPGA на профессиональной отладочной плате',
    eyebrow: 'Программируемая логика',
    title: 'FPGA и решения Xilinx',
    description: 'Компоненты для цифровой обработки сигналов, телекоммуникаций и встраиваемых систем.',
    logo: '/storefront/xilinx-logo.png',
  },
  {
    image: '/storefront/hero-embedded.jpg',
    href: '/catalog?category=mikrokontrollery',
    alt: 'Микроконтроллеры, радиомодули и компоненты в инженерной лаборатории',
    eyebrow: 'Для embedded-разработки',
    title: 'MCU, DSP и беспроводные модули',
    description: 'Подбор элементной базы от прототипа до устойчивой серийной поставки.',
    align: 'right' as const,
  },
]

const quickLinks = [
  {
    image: '/storefront/category-mcu.jpg',
    title: 'Микроконтроллеры и DSP',
    description: 'MCU, процессоры, отладочные платы',
    href: '/catalog?category=mikrokontrollery',
  },
  {
    image: '/storefront/category-power.jpg',
    title: 'Управление питанием',
    description: 'DC-DC, LDO, PMIC, драйверы',
    href: '/catalog?category=pitanie',
  },
]

export function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, AUTOPLAY_DELAY_MS)

    return () => window.clearInterval(timer)
  }, [paused])

  return (
    <section className="bg-canvas pb-3 pt-4">
      <div className="mx-auto grid max-w-[1440px] gap-3 px-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          className="relative min-h-[230px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[#0c2340] sm:min-h-[246px]"
          role="region"
          aria-roledescription="карусель"
          aria-label="Подборки компонентов"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {slides.map((slide, index) => {
            const isActive = index === activeSlide
            const contentOnRight = slide.align === 'right'

            return (
              <Link
                key={slide.image}
                href={slide.href}
                className={`absolute inset-0 transition-opacity duration-[400ms] motion-reduce:transition-none ${
                  isActive ? 'z-[1] opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1050px"
                />
                <div
                  className={`absolute inset-0 ${
                    contentOnRight
                      ? 'bg-gradient-to-l from-[#08172c]/96 via-[#08172c]/78 to-[#08172c]/10'
                      : 'bg-gradient-to-r from-[#08172c]/96 via-[#08172c]/76 to-transparent'
                  }`}
                />
                <div
                  className={`relative flex h-full max-w-[650px] flex-col justify-center p-5 text-white sm:p-8 ${
                    contentOnRight ? 'ml-auto items-start' : ''
                  }`}
                >
                  {slide.logo && (
                    <span className="mb-3 flex h-9 w-[136px] items-center rounded-[5px] bg-white px-3">
                      <Image
                        src={slide.logo}
                        alt="Xilinx"
                        width={112}
                        height={34}
                        className="h-5 w-auto object-contain"
                      />
                    </span>
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/66">
                    {slide.eyebrow}
                  </span>
                  <h1 className="mt-2 max-w-[22ch] text-[27px] font-bold leading-[1.06] tracking-[-0.025em] sm:text-[36px]">
                    {slide.title}
                  </h1>
                  <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-white/76 sm:text-sm">
                    {slide.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative min-h-[132px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white lg:min-h-0"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.025]"
                sizes="(max-width: 1024px) 50vw, 340px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101722]/92 via-[#101722]/14 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                <div className="font-display text-base font-bold leading-tight">{item.title}</div>
                <div className="mt-1 text-xs text-white/72">{item.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
