'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

interface Brand {
  id: string
  name: string
  country: string
  flag: string
  logo: string | null
  categories: string[]
  productCount: number
  featured: boolean
  /** размер карточки в топе: 'large' | 'medium' | 'small' */
  size?: 'large' | 'medium' | 'small'
}

const brands: Brand[] = [
  // ── Китай ──────────────────────────────────────────────
  {
    id: 'espressif',
    name: 'Espressif',
    country: 'Китай',
    flag: '🇨🇳',
    logo: '/brands/espressi.png',
    categories: ['Контроллеры', 'WiFi-модули', 'Bluetooth'],
    productCount: 4200,
    featured: true,
    size: 'large',
  },
  {
    id: 'worldsemi',
    name: 'WorldSemi',
    country: 'Китай',
    flag: '🇨🇳',
    logo: '/brands/worldsemi.png',
    categories: ['Светодиоды', 'RGB', 'LED-матрицы'],
    productCount: 28000,
    featured: true,
    size: 'medium',
  },
  {
    id: 'wch',
    name: 'WCH',
    country: 'Китай',
    flag: '🇨🇳',
    logo: '/brands/wch.png',
    categories: ['USB-мосты', 'Микроконтроллеры', 'RISC-V'],
    productCount: 1800,
    featured: true,
    size: 'medium',
  },
  {
    id: 'hilink',
    name: 'Hi-Link',
    country: 'Китай',
    flag: '🇨🇳',
    logo: '/brands/hilink.png',
    categories: ['Блоки питания', 'AC-DC', 'Модули'],
    productCount: 3400,
    featured: true,
    size: 'medium',
  },
  {
    id: 'gigadevice',
    name: 'GigaDevice',
    country: 'Китай',
    flag: '🇨🇳',
    logo: '/brands/gigadevice.png',
    categories: ['Flash-память', 'Микроконтроллеры'],
    productCount: 6100,
    featured: true,
    size: 'medium',
  },
  {
    id: 'winbond',
    name: 'Winbond',
    country: 'Китай',
    flag: '🇨🇳',
    logo: '/brands/winbond.png',
    categories: ['Flash-память', 'DRAM'],
    productCount: 9200,
    featured: true,
    size: 'small',
  },
  {
    id: 'holtek',
    name: 'Holtek',
    country: 'Китай',
    flag: '🇨🇳',
    logo: '/brands/holtek.png',
    categories: ['Микроконтроллеры', 'Микросхемы'],
    productCount: 5600,
    featured: false,
    size: 'small',
  },
  {
    id: 'songle',
    name: 'Songle',
    country: 'Китай',
    flag: '🇨🇳',
    logo: null,
    categories: ['Реле', 'Автоматика'],
    productCount: 4200,
    featured: false,
    size: 'small',
  },
  // ── Тайвань / Япония / Европа / США ───────────────────
  {
    id: 'yageo',
    name: 'Yageo',
    country: 'Тайвань',
    flag: '🇹🇼',
    logo: '/brands/yageo.png',
    categories: ['Резисторы', 'Конденсаторы', 'Индуктивности'],
    productCount: 48200,
    featured: true,
    size: 'large',
  },
  {
    id: 'murata',
    name: 'Murata',
    country: 'Япония',
    flag: '🇯🇵',
    logo: '/brands/murata.png',
    categories: ['Конденсаторы', 'Фильтры', 'Модули'],
    productCount: 31500,
    featured: true,
    size: 'medium',
  },
  {
    id: 'stmicroelectronics',
    name: 'STMicroelectronics',
    country: 'Швейцария',
    flag: '🇨🇭',
    logo: '/brands/stmicroelectronics.svg',
    categories: ['Микроконтроллеры', 'Силовые устройства', 'Датчики'],
    productCount: 12400,
    featured: true,
    size: 'medium',
  },
  {
    id: 'infineon',
    name: 'Infineon',
    country: 'Германия',
    flag: '🇩🇪',
    logo: '/brands/infineon.png',
    categories: ['Транзисторы', 'Диоды', 'Микросхемы'],
    productCount: 18700,
    featured: true,
    size: 'medium',
  },
  {
    id: 'texas-instruments',
    name: 'Texas Instruments',
    country: 'США',
    flag: '🇺🇸',
    logo: '/brands/texas-instruments.png',
    categories: ['Микросхемы', 'АЦП/ЦАП', 'Усилители'],
    productCount: 24600,
    featured: true,
    size: 'medium',
  },
  {
    id: 'vishay',
    name: 'Vishay',
    country: 'США',
    flag: '🇺🇸',
    logo: '/brands/vishay.png',
    categories: ['Диоды', 'Резисторы', 'Конденсаторы'],
    productCount: 45000,
    featured: false,
    size: 'small',
  },
  {
    id: 'analog-devices',
    name: 'Analog Devices',
    country: 'США',
    flag: '🇺🇸',
    logo: '/brands/analog-devices.png',
    categories: ['Датчики', 'АЦП/ЦАП', 'Усилители'],
    productCount: 6700,
    featured: false,
    size: 'small',
  },
  {
    id: 'xilinx',
    name: 'Xilinx',
    country: 'США',
    flag: '🇺🇸',
    logo: '/brands/Xilinx-Logo.png',
    categories: ['FPGA', 'Программируемая логика', 'SoC'],
    productCount: 3200,
    featured: true,
    size: 'medium',
  },
  {
    id: 'sharp',
    name: 'Sharp',
    country: 'Япония',
    flag: '🇯🇵',
    logo: '/brands/Sharp.png',
    categories: ['Оптопары', 'Фотодиоды', 'Датчики'],
    productCount: 34000,
    featured: false,
    size: 'small',
  },
  {
    id: 'gct',
    name: 'GCT',
    country: 'США',
    flag: '🇺🇸',
    logo: '/brands/gct.png',
    categories: ['Разъёмы', 'USB', 'Клеммы'],
    productCount: 12300,
    featured: false,
    size: 'small',
  },
]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function LogoCard({
  brand,
  className = '',
}: {
  brand: Brand
  className?: string
}) {
  return (
    <Link
      href={`/catalog?brand=${brand.id}`}
      className={`group relative flex items-center justify-center bg-[#f8f8f8] border border-black/6 rounded-lg overflow-hidden transition-all duration-200 hover:border-[#0066cc]/30 hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      {brand.logo ? (
        <div className="relative w-full h-full flex items-center justify-center p-6">
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        </div>
      ) : (
        <span className="text-lg font-black text-[#1c1917] group-hover:text-[#0066cc] transition-colors px-4 text-center">
          {brand.name}
        </span>
      )}
    </Link>
  )
}

export default function BrandsPage() {
  const [search, setSearch] = useState('')
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  const featuredBrands = brands.filter((b) => b.featured)

  const filteredBrands = useMemo(() => {
    let list = [...brands].sort((a, b) => a.name.localeCompare(b.name, 'en'))
    if (activeLetter) {
      list = list.filter((b) => b.name.toUpperCase().startsWith(activeLetter))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((b) => b.name.toLowerCase().includes(q))
    }
    return list
  }, [search, activeLetter])

  const totalPositions = brands.reduce((s, b) => s + b.productCount, 0)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-[#a8a29e]">
              <Link href="/" className="hover:text-[#78716c] transition-colors">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-[#78716c]">Бренды</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-10 space-y-12">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1c1917]">
                Каталог брендов
                <span className="ml-3 text-base font-normal text-[#a8a29e]">
                  {brands.length} брендов
                </span>
              </h1>
              <p className="text-sm text-[#78716c] mt-1">
                {(totalPositions / 1000).toFixed(0)}к+ позиций в каталоге
              </p>
            </div>
          </div>

          {/* ── Top brands mosaic ── */}
          <section>
            <h2 className="text-base font-bold text-[#1c1917] mb-5">
              Топ {featuredBrands.length} брендов
            </h2>

            {/*
              Mosaic layout (расширенная):
              Row 1: large(2col×2row) | medium | medium | Xilinx(2col×2row)
              Row 2:                  | medium | medium |
              Row 3: medium | medium  | large(2col×2row) | medium | medium
              Row 4: medium | medium  |                  | medium | medium
              Row 5: medium | medium  | medium | medium | medium | medium
            */}
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: 'repeat(6, 1fr)',
                gridTemplateRows: 'repeat(5, 120px)',
              }}
            >
              {/* Espressif — large */}
              <LogoCard
                brand={brands.find((b) => b.id === 'espressif')!}
                className="col-span-2 row-span-2"
              />
              {/* WorldSemi */}
              <LogoCard brand={brands.find((b) => b.id === 'worldsemi')!} className="col-span-1 row-span-1" />
              {/* WCH */}
              <LogoCard brand={brands.find((b) => b.id === 'wch')!} className="col-span-1 row-span-1" />
              {/* Xilinx — large (НОВЫЙ, ЗАМЕТНЫЙ) */}
              <LogoCard
                brand={brands.find((b) => b.id === 'xilinx')!}
                className="col-span-2 row-span-2"
              />
              {/* Hi-Link */}
              <LogoCard brand={brands.find((b) => b.id === 'hilink')!} className="col-span-1 row-span-1" />
              {/* GigaDevice */}
              <LogoCard brand={brands.find((b) => b.id === 'gigadevice')!} className="col-span-1 row-span-1" />

              {/* Row 3 */}
              {/* Murata */}
              <LogoCard brand={brands.find((b) => b.id === 'murata')!} className="col-span-1 row-span-1" />
              {/* STMicro */}
              <LogoCard brand={brands.find((b) => b.id === 'stmicroelectronics')!} className="col-span-1 row-span-1" />
              {/* Yageo — large */}
              <LogoCard
                brand={brands.find((b) => b.id === 'yageo')!}
                className="col-span-2 row-span-2"
              />
              {/* Winbond */}
              <LogoCard brand={brands.find((b) => b.id === 'winbond')!} className="col-span-1 row-span-1" />
              {/* Infineon */}
              <LogoCard brand={brands.find((b) => b.id === 'infineon')!} className="col-span-1 row-span-1" />

              {/* Row 4 */}
              {/* Holtek */}
              <LogoCard brand={brands.find((b) => b.id === 'holtek')!} className="col-span-1 row-span-1" />
              {/* Texas Instruments */}
              <LogoCard brand={brands.find((b) => b.id === 'texas-instruments')!} className="col-span-1 row-span-1" />
              {/* Vishay */}
              <LogoCard brand={brands.find((b) => b.id === 'vishay')!} className="col-span-1 row-span-1" />
              {/* Analog Devices */}
              <LogoCard brand={brands.find((b) => b.id === 'analog-devices')!} className="col-span-1 row-span-1" />

              {/* Row 5 - новый ряд */}
              {/* Sharp */}
              <LogoCard brand={brands.find((b) => b.id === 'sharp')!} className="col-span-1 row-span-1" />
              {/* GCT */}
              <LogoCard brand={brands.find((b) => b.id === 'gct')!} className="col-span-1 row-span-1" />
              {/* Songle */}
              <LogoCard brand={brands.find((b) => b.id === 'songle')!} className="col-span-1 row-span-1" />
            </div>
          </section>

          {/* ── All brands A–Z ── */}
          <section>
            <h2 className="text-base font-bold text-[#1c1917] mb-5">
              Все бренды от A до Z
            </h2>

            {/* Search + alphabet */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]" />
                <input
                  type="text"
                  placeholder="Поиск по бренду"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setActiveLetter(null) }}
                  className="w-full h-9 pl-8 pr-3 text-sm border border-black/12 rounded focus:outline-none focus:border-[#0066cc] transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {ALPHABET.map((letter) => (
                  <button
                    key={letter}
                    onClick={() => {
                      setActiveLetter(activeLetter === letter ? null : letter)
                      setSearch('')
                    }}
                    className={`w-7 h-7 text-xs font-medium rounded transition-colors ${
                      activeLetter === letter
                        ? 'bg-[#0066cc] text-white'
                        : 'text-[#78716c] hover:bg-[#e8f4ff] hover:text-[#0066cc]'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand grid */}
            {filteredBrands.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/catalog?brand=${brand.id}`}
                    className="group relative flex flex-col items-center justify-center bg-[#f8f8f8] border border-black/6 rounded-lg p-5 h-28 overflow-hidden transition-all duration-300 hover:border-[#0066cc]/30 hover:shadow-lg hover:-translate-y-1"
                  >
                    {brand.logo ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          className="object-contain transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 16vw"
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-[#1c1917] group-hover:text-[#0066cc] transition-colors text-center leading-tight">
                        {brand.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-[#a8a29e] text-sm">
                Бренды не найдены
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="bg-[#0066cc] rounded p-8 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />
            <div className="relative">
              <h2 className="text-xl font-bold text-white mb-2">Нет нужного бренда?</h2>
              <p className="text-white/70 text-sm mb-5 max-w-md mx-auto">
                Работаем с более чем 200 производителями. Напишите нам — найдём нужные компоненты.
              </p>
              <a
                href="mailto:info@electromagaz.ru"
                className="inline-flex items-center gap-2 h-10 px-6 text-sm font-semibold text-[#0066cc] bg-white hover:bg-white rounded transition-all btn-primary shadow-sm"
              >
                Написать запрос
              </a>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
