'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { BRANDS } from '@/lib/brands'

export function Manufacturers() {
  const [paused, setPaused] = useState(false)
  const brands = BRANDS.filter((brand) => brand.featured && brand.logo).slice(0, 12)
  if (brands.length === 0) return null

  return (
    <section className="border-y border-[var(--border)] bg-white py-7 sm:py-9" aria-label="Производители">
      <div className="storefront-container">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Знакомые бренды. Нужные компоненты.</h2>
          <button type="button" aria-label={paused ? 'Продолжить ленту производителей' : 'Приостановить ленту производителей'} onClick={() => setPaused(!paused)} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-ink-3 hover:bg-surface-muted motion-reduce:hidden">{paused ? <Play size={17} /> : <Pause size={17} />}</button>
        </div>
        <div className="brand-marquee overflow-hidden" data-paused={paused}>
          <div className="brand-track flex w-max">
            {[false, true].map((duplicate) => (
              <div key={String(duplicate)} className="brand-set flex gap-3 pr-3" aria-hidden={duplicate || undefined} inert={duplicate || undefined}>
                {brands.map((brand) => (
                  <Link key={brand.id} href={brand.id === 'xilinx' ? '/brands#brand-xilinx' : `/catalog?manufacturer=${brand.id}`} aria-label={brand.name} className="relative flex h-20 w-36 shrink-0 items-center justify-center rounded-xl bg-surface-muted p-4 transition-colors hover:bg-azure-light">
                    <Image src={brand.logo!} alt={brand.name} width={112} height={44} loading="lazy" className="max-h-11 object-contain" />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <Link href="/brands" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-azure hover:underline">Все производители →</Link>
      </div>
    </section>
  )
}
