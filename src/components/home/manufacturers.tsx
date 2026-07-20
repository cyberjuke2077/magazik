import Link from 'next/link'
import Image from 'next/image'
import { BRANDS } from '@/lib/brands'
import { SectionHeader } from './section-header'

export function Manufacturers() {
  const brands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  if (brands.length === 0) return null
  return (
    <section className="bg-canvas py-5">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
        <SectionHeader
          title="Бренды в каталоге"
          href="/brands"
          linkLabel="Все бренды"
        />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/catalog?brand=${b.id}`}
              aria-label={b.name}
              className="group flex h-16 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-white p-3 transition-colors hover:border-[var(--border-2)]"
            >
              <div className="relative h-8 w-full opacity-65 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">
                <Image
                  src={b.logo!}
                  alt={b.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
