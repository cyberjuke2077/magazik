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
        <div className="grid grid-cols-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/catalog?brand=${b.id}`}
              aria-label={b.name}
              className="group -mb-px -mr-px flex h-[72px] items-center justify-center border-b border-r border-[var(--border)] p-3 transition-colors hover:bg-surface-muted"
            >
              <div className="relative h-8 w-full opacity-70 grayscale transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0 motion-reduce:transition-none">
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
