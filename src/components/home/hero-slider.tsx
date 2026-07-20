'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const slides = [
  {
    image: '/photos/hero.jpg',
    alt: 'Электронные компоненты и печатная плата',
    title: 'Компоненты для электроники',
    description: 'Для разработки и серийного производства. Поиск по MPN, наличие и характеристики.',
    imageClassName: 'object-cover',
  },
  {
    image: '/slider/slide-1.png',
    alt: 'Оригинальные компоненты Xilinx',
    imageClassName: 'object-contain',
  },
]

const quickLinks = [
  {
    image: '/photos/cat-2.jpg',
    title: 'Микроконтроллеры',
    description: 'STM32, AVR, ESP32',
    href: '/catalog?category=mikrokontrollery',
  },
  {
    image: '/photos/cat-3.jpg',
    title: 'Питание',
    description: 'DC-DC, LDO, драйверы',
    href: '/catalog?category=pitanie',
  },
]

export function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0)

  function showPrevious() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length)
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % slides.length)
  }

  return (
    <section className="bg-canvas pb-3 pt-4">
      <div className="mx-auto grid max-w-[1440px] gap-3 px-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          className="relative min-h-[230px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[#eef0f2] sm:min-h-[280px]"
          role="region"
          aria-roledescription="карусель"
          aria-label="Подборки компонентов"
        >
          {slides.map((slide, index) => (
            <div
              key={slide.image}
              className={`absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${
                index === activeSlide ? 'z-[1] opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-hidden={index !== activeSlide}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                className={slide.imageClassName}
                sizes="(max-width: 1024px) 100vw, 1050px"
              />
              {slide.title && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#151c28]/95 via-[#151c28]/75 to-transparent" />
                  <div className="relative flex h-full max-w-[650px] flex-col justify-center p-6 text-white sm:p-9">
                    <h1 className="max-w-[24ch] text-[30px] font-bold leading-[1.06] tracking-[-0.025em] sm:text-[40px]">
                      {slide.title}
                    </h1>
                    <p className="mt-3 max-w-[54ch] text-sm leading-relaxed text-white/76 sm:text-[15px]">
                      {slide.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="absolute bottom-3 right-3 z-10 flex items-center overflow-hidden rounded-[var(--radius-control)] bg-[#151c28]/78 text-white backdrop-blur-sm">
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Предыдущий слайд"
              className="flex size-11 cursor-pointer items-center justify-center transition-colors hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"
            >
              <ChevronLeft size={19} />
            </button>
            <span className="min-w-12 text-center text-xs font-semibold tabular-nums" aria-live="polite">
              {activeSlide + 1} / {slides.length}
            </span>
            <button
              type="button"
              onClick={showNext}
              aria-label="Следующий слайд"
              className="flex size-11 cursor-pointer items-center justify-center transition-colors hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"
            >
              <ChevronRight size={19} />
            </button>
          </div>
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#151c28]/88 via-[#151c28]/8 to-transparent" />
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
