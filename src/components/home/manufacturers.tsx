import Link from 'next/link'
import Image from 'next/image'
import { BRANDS } from '@/lib/brands'

export function Manufacturers() {
  const brands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  if (brands.length === 0) return null

  return (
    <section className="overflow-hidden border-y border-[var(--border)] bg-white py-4 lg:py-6" aria-label="Производители" data-motion-reveal>
      <div className="brand-marquee group flex w-max">
        {[0, 1].map((copyIndex) => (
          <div key={copyIndex} className="flex shrink-0 gap-3 pr-3 lg:gap-4 lg:pr-4" aria-hidden={copyIndex === 1}>
            {brands.map((brand) => (
              <Link
                key={`${copyIndex}-${brand.id}`}
                href={brand.id === 'xilinx' ? '/brands#brand-xilinx' : `/catalog?manufacturer=${brand.id}`}
                aria-label={copyIndex === 0 ? brand.name : undefined}
                tabIndex={copyIndex === 0 ? 0 : -1}
                className="flex h-[62px] w-[128px] shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white p-3 transition duration-300 hover:-translate-y-1 hover:border-azure/30 hover:shadow-[var(--shadow-azure-sm)] active:translate-y-0 lg:h-[72px] lg:w-[148px]"
              >
                <span className="relative h-9 w-full">
                  <Image src={brand.logo!} alt={brand.name} fill className="object-contain" sizes="148px" />
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
