import Link from 'next/link'
import Image from 'next/image'
import { BRANDS } from '@/lib/brands'

export function Manufacturers() {
  const brands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  if (brands.length === 0) return null

  return (
    <section className="border-y border-[var(--border)] bg-surface-muted py-7" aria-label="Производители">
      <div className="mx-auto mb-5 flex max-w-[1380px] items-center justify-between px-4 lg:px-0">
        <h2 className="text-sm font-semibold text-ink">Производители</h2>
        <Link href="/brands" className="text-sm font-medium text-azure hover:text-azure-hover">Все бренды</Link>
      </div>
      <div className="mx-auto grid max-w-[1380px] grid-cols-3 border-l border-t border-[var(--border)] bg-white sm:grid-cols-4 lg:grid-cols-6">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={brand.id === 'xilinx' ? '/brands#brand-xilinx' : `/catalog?manufacturer=${brand.id}`}
            aria-label={brand.name}
            className="flex h-[76px] min-w-0 items-center justify-center border-b border-r border-[var(--border)] bg-white px-5 transition-colors hover:bg-surface-muted"
          >
            <span className="relative h-8 w-full opacity-75 grayscale transition-[filter,opacity] hover:opacity-100 hover:grayscale-0">
              <Image
                src={brand.logo!}
                alt={brand.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 230px"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
