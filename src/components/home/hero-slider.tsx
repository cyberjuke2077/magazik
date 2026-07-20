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
    title: 'MCU и DSP',
    description: 'MCU и DSP',
    href: '/catalog?category=mikrokontrollery',
  },
  {
    image: '/storefront/category-power.jpg',
    title: 'Питание',
    description: 'DC-DC и PMIC',
    href: '/catalog?category=pitanie',
  },
  {
    image: '/storefront/category-converters.jpg',
    title: 'АЦП и ЦАП',
    description: 'Преобразователи',
    href: '/catalog?category=atsp-tsap',
  },
  {
    image: '/storefront/category-interfaces.jpg',
    title: 'Интерфейсы',
    description: 'Логика и драйверы',
    href: '/catalog?category=interfeysy',
  },
  {
    image: '/storefront/category-rf.jpg',
    title: 'RF-модули',
    description: 'RF и беспроводная связь',
    href: '/catalog?category=rch',
  },
  {
    image: '/storefront/category-sensors.jpg',
    title: 'Датчики',
    description: 'Сенсоры и измерения',
    href: '/catalog?category=datchiki',
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
    <section className="bg-white pb-5 pt-[3px] lg:pb-8 lg:pt-6">
      <div className="mx-auto max-w-[1380px] overflow-hidden px-4 lg:flex lg:gap-4 lg:px-0">
        <div
          className="relative h-[146px] w-full shrink-0 overflow-hidden rounded-xl bg-[#0c2340] lg:h-[206px] lg:w-[282px]"
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
                  className={`relative flex h-full flex-col justify-center p-4 text-white lg:p-5 ${
                    contentOnRight ? 'ml-auto items-start' : ''
                  }`}
                >
                  {slide.logo && (
                    <span className="mb-2 flex h-7 w-[108px] items-center rounded-md bg-white px-2.5">
                      <Image
                        src={slide.logo}
                        alt="Xilinx"
                        width={92}
                        height={28}
                        className="h-4 w-auto object-contain"
                      />
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/72">
                    {slide.eyebrow}
                  </span>
                  <h1 className="mt-1.5 max-w-[20ch] text-[21px] font-bold leading-[1.05] tracking-[-0.025em] lg:text-[22px]">
                    {slide.title}
                  </h1>
                  <p className="mt-2 max-w-[30ch] text-[12px] leading-[1.35] text-white/78 lg:text-[13px]">
                    {slide.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto lg:mt-0 lg:gap-4 lg:overflow-visible">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative h-[111px] w-[100px] shrink-0 overflow-hidden rounded-xl bg-white lg:h-[206px] lg:w-[183px]"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.025]"
                sizes="(max-width: 1024px) 100px, 183px"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white via-white/84 to-white/5" />
              <div className="absolute inset-x-0 top-0 p-3 text-ink lg:p-5">
                <div className="font-display text-[12px] font-bold leading-[1.08] lg:text-[17px]">{item.title}</div>
                <div className="mt-1 hidden text-[13px] leading-tight text-ink-2 lg:block">{item.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
