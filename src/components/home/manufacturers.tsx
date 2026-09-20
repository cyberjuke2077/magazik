import Link from 'next/link'
import Image from 'next/image'
import { BRANDS } from '@/lib/brands'

export function Manufacturers() {
  const brands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  if (brands.length === 0) return null

  return (
    <section className="border-y border-[var(--border)] bg-white py-5 lg:py-7" aria-label="Производители" data-motion-reveal>
      <div className="no-scrollbar mx-auto flex max-w-[1380px] gap-2.5 overflow-x-auto px-4 lg:gap-3 lg:px-0">
        {brands.map((brand, index) => (
          <Link
            key={brand.id}
            href={brand.id === 'xilinx' ? '/brands#brand-xilinx' : `/catalog?manufacturer=${brand.id}`}
            aria-label={brand.name}
            className="flex h-[68px] w-[128px] shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white p-3 transition duration-300 hover:-translate-y-1 hover:border-azure/30 hover:shadow-[var(--shadow-azure-sm)] active:translate-y-0 lg:h-[76px] lg:w-auto lg:min-w-0 lg:flex-1"
          >
            <span className="relative h-9 w-full">
              <Image
                src={brand.logo!}
                alt={brand.name}
                fill
                loading={index < 3 ? 'eager' : 'lazy'}
                className="object-contain"
                sizes="(max-width: 1024px) 128px, 115px"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
