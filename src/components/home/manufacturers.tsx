import Link from 'next/link'
import Image from 'next/image'
import { BRANDS } from '@/lib/brands'
import { HorizontalShelf } from '@/components/ui/horizontal-shelf'

// Compensate for whitespace inside the original logos without changing the assets.
const logoScale: Record<string, number> = {
  espressif: 1.45, worldsemi: 2.5, wch: 2.25, hilink: 1.75,
  gigadevice: 1.35, yageo: 1.2, murata: 1.18,
}

export function Manufacturers() {
  const brands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  if (brands.length === 0) return null

  return (
    <section className="bg-white pb-6 pt-3 lg:pb-7 lg:pt-4" aria-label="Производители" data-motion-reveal>
      <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
        <HorizontalShelf label="Производители" className="flex gap-3 py-1">
        {brands.map((brand, index) => (
          <Link
            key={brand.id}
            href={brand.id === 'xilinx' ? '/brands#brand-xilinx' : `/catalog?manufacturer=${brand.id}`}
            aria-label={brand.name}
            className="flex h-[80px] w-[160px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/8 bg-white px-4 transition-colors hover:border-azure/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-azure"
          >
            <span className="relative h-[52px] w-full">
              <Image
                src={brand.logo!}
                alt={brand.name}
                fill
                loading={index < 3 ? 'eager' : 'lazy'}
                className="object-contain"
                style={{ transform: `scale(${logoScale[brand.id] ?? 1})` }}
                sizes="320px"
              />
            </span>
          </Link>
        ))}
        </HorizontalShelf>
      </div>
    </section>
  )
}
