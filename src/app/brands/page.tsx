'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { BRANDS, type Brand } from '@/lib/brands'
import { COMPANY } from '@/lib/company'

const brands = BRANDS

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
      id={`brand-${brand.id}`}
      href={`/catalog?manufacturer=${brand.id}`}
      className={`group relative flex items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white transition-colors duration-200 hover:border-[var(--border-2)] ${className}`}
    >
      {brand.logo ? (
        <div className="relative w-full h-full flex items-center justify-center p-6">
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        </div>
      ) : (
        <span className="text-lg font-black text-[#1c1917] group-hover:text-azure transition-colors px-4 text-center">
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
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-black/8 bg-white">
          <div className="mx-auto max-w-[1440px] px-3 py-2 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="transition-colors hover:text-ink-2">Главная</Link>
              <ChevronRight size={10} />
              <span className="text-ink-2">Бренды</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] space-y-9 px-4 py-7 lg:px-0">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.035em] text-ink md:text-3xl">
                Производители
                <span className="ml-3 text-base font-normal text-ink-4">
                  {brands.length} брендов
                </span>
              </h1>
              <p className="mt-1 text-sm text-ink-3">
                {(totalPositions / 1000).toFixed(0)}к+ позиций в каталоге
              </p>
            </div>
          </div>

          {/* ── Top brands mosaic ── */}
          <section>
            <h2 className="mb-5 text-lg font-bold text-ink">
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
            <div className="grid auto-rows-[112px] grid-flow-dense grid-cols-2 gap-3 md:grid-cols-6">
              {/* Espressif - large */}
              <LogoCard
                brand={brands.find((b) => b.id === 'espressif')!}
                className="col-span-2 row-span-2"
              />
              {/* WorldSemi */}
              <LogoCard brand={brands.find((b) => b.id === 'worldsemi')!} className="col-span-1 row-span-1" />
              {/* WCH */}
              <LogoCard brand={brands.find((b) => b.id === 'wch')!} className="col-span-1 row-span-1" />
              {/* Xilinx - large */}
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
              {/* Yageo - large */}
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

          {/* All brands A-Z */}
          <section>
            <h2 className="mb-5 text-lg font-bold text-ink">
              Все бренды от A до Z
            </h2>

            {/* Search + alphabet */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
                <input
                  type="text"
                  placeholder="Поиск по бренду"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setActiveLetter(null) }}
                  className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-white pl-8 pr-3 text-sm outline-none transition-colors focus:border-azure"
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
                        ? 'bg-azure text-white'
                        : 'text-[#78716c] hover:bg-azure-light hover:text-azure'
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
                    href={`/catalog?manufacturer=${brand.id}`}
                    className="group relative flex h-28 flex-col items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-5 transition-colors duration-200 hover:border-[var(--border-2)]"
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
                      <span className="text-sm font-bold text-[#1c1917] group-hover:text-azure transition-colors text-center leading-tight">
                        {brand.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-ink-4">
                Бренды не найдены
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-7 text-center">
            <div className="relative">
              <h2 className="mb-2 text-xl font-bold text-ink">Нет нужного производителя?</h2>
              <p className="mx-auto mb-5 max-w-md text-sm text-ink-3">
                Пришлите маркировку компонента. Проверим доступность и предложим поставку.
              </p>
              <a
                href={`mailto:${COMPANY.email}`}
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-azure px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-azure-hover active:translate-y-px"
              >
                Написать нам
              </a>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
