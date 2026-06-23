'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Truck, FileText, Replace } from 'lucide-react'

/* Слайды на тематичных фото (public/photos). */
const slides = [
  { image: '/photos/hero.jpg', tag: 'Каталог', title: 'Микроконтроллеры и процессоры', href: '/catalog?category=mikrokontrollery' },
  { image: '/photos/cat-1.jpg', tag: 'Популярное', title: 'Усилители и компараторы', href: '/catalog?category=usiliteli' },
  { image: '/photos/cat-2.jpg', tag: 'Каталог', title: 'Датчики и сенсоры', href: '/catalog?category=datchiki' },
  { image: '/photos/cat-3.jpg', tag: 'Питание', title: 'Управление питанием', href: '/catalog?category=pitanie' },
  { image: '/photos/cat-4.jpg', tag: 'Каталог', title: 'Интерфейсы и логика', href: '/catalog?category=interfeysy' },
]

const miniTrust = [
  { icon: Truck, label: 'Склад в Москве' },
  { icon: FileText, label: 'Безнал с НДС' },
  { icon: Replace, label: 'Подбор аналогов' },
]

function useAutoSlider(total: number, interval = 7000) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % total), interval)
  }

  useEffect(() => {
    reset()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, interval])

  function go(idx: number) { setCurrent(idx); reset() }
  function prev() { go((current - 1 + total) % total) }
  function next() { go((current + 1) % total) }
  return { current, go, prev, next }
}

export function HeroSlider({ totalProducts }: { totalProducts: number }) {
  const { current, go, prev, next } = useAutoSlider(slides.length)
  const active = slides[current]

  return (
    <section className="bg-white pt-10 md:pt-14 pb-4">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">

          {/* Текст */}
          <div className="max-w-2xl">
            <div className="ui-eyebrow mb-5">Поставщик электронных компонентов</div>
            <h1 className="text-display text-balance">
              Электронные компоненты для&nbsp;<span className="text-azure">инженеров и&nbsp;производства</span>
            </h1>
            <p className="text-lead mt-6 max-w-[54ch]">
              <span className="price text-ink">{totalProducts.toLocaleString('ru-RU')}</span>{' '}
              позиций в наличии и под заказ. Подбираем аналоги, поставляем юрлицам по&nbsp;безналу с&nbsp;документами.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className="ui-btn ui-btn-primary ui-btn-lg group">
                Открыть каталог
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/request-quote" className="ui-btn ui-btn-secondary ui-btn-lg">Запросить КП</Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
              {miniTrust.map((t) => (
                <li key={t.label} className="flex items-center gap-2 text-sm font-medium text-ink-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-azure-light text-azure">
                    <t.icon size={15} strokeWidth={2} />
                  </span>
                  {t.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Слайдер */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-ink shadow-[var(--shadow-lg)] sm:aspect-[16/10] lg:aspect-[4/3]">
            {slides.map((s, i) => (
              <div
                key={s.image}
                className="absolute inset-0 transition-opacity duration-700 ease-out"
                style={{ opacity: i === current ? 1 : 0 }}
                aria-hidden={i !== current}
              >
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="object-cover"
                  priority={i === 0}
                  sizes="(max-width: 1024px) 100vw, 640px"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-ink/80 via-ink/30 to-transparent" />
              </div>
            ))}

            {/* Подпись */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-8">
              <div className="text-xs font-bold uppercase tracking-[0.08em] text-white/70">{active.tag}</div>
              <div className="mt-2 max-w-sm text-2xl font-bold leading-tight text-white md:text-3xl">{active.title}</div>
              <Link
                href={active.href}
                className="group mt-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-bold text-ink backdrop-blur transition-colors hover:bg-white"
              >
                Смотреть раздел
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Стрелки */}
            <button
              onClick={prev}
              aria-label="Предыдущий слайд"
              className="absolute left-4 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Следующий слайд"
              className="absolute right-4 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronRight size={18} />
            </button>

            {/* Точки */}
            <div className="absolute right-6 top-6 z-20 flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Слайд ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
