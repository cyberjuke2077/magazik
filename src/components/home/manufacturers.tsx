import Link from 'next/link'
import Image from 'next/image'
import { BRANDS } from '@/lib/brands'

export function Manufacturers() {
  const brands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  if (brands.length === 0) return null
  const marqueeBrands = [...brands, ...brands]

  return (
    <section className="overflow-hidden border-y border-[var(--border)] bg-surface-muted py-7" aria-label="Производители" data-motion-reveal>
      <div className="mx-auto mb-5 flex max-w-[1380px] items-center justify-between px-4 lg:px-0">
        <h2 className="text-sm font-semibold text-ink">Производители</h2>
        <Link href="/brands" className="text-sm font-medium text-azure hover:text-azure-hover">Все бренды</Link>
      </div>
      <div className="overflow-hidden border-y border-[var(--border)] bg-white">
        <div className="animate-marquee w-max">
        {marqueeBrands.map((brand, index) => (
          <Link
            key={`${brand.id}-${index}`}
            href={brand.id === 'xilinx' ? '/brands#brand-xilinx' : `/catalog?manufacturer=${brand.id}`}
            aria-label={brand.name}
            aria-hidden={index >= brands.length ? true : undefined}
            tabIndex={index >= brands.length ? -1 : undefined}
            className={`flex h-[76px] w-[156px] shrink-0 items-center justify-center border-r border-[var(--border)] bg-white px-6 transition-[filter,opacity] hover:opacity-100 hover:grayscale-0 ${index >= brands.length ? 'marquee-duplicate' : ''}`}
          >
            <span className="relative h-8 w-full opacity-72 grayscale transition-[filter,opacity] hover:opacity-100 hover:grayscale-0">
              <Image
                src={brand.logo!}
                alt={brand.name}
                fill
                loading={index < 3 ? 'eager' : 'lazy'}
                className="object-contain"
                sizes="156px"
              />
            </span>
          </Link>
        ))}
        </div>
      </div>
    </section>
  )
}
