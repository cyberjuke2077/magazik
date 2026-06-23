import Link from 'next/link'
import Image from 'next/image'
import { BRANDS } from '@/lib/brands'
import { SectionHeader } from './section-header'

export function Manufacturers() {
  const brands = BRANDS.filter((b) => b.featured && b.logo).slice(0, 12)
  if (brands.length === 0) return null
  return (
    <section className="section-pad-sm border-y border-[var(--border)] bg-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <SectionHeader
          eyebrow="Производители"
          title="Бренды в каталоге"
          description="Оригинальные компоненты ведущих мировых производителей и проверенных альтернатив."
          href="/brands"
          linkLabel="Все бренды"
        />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/catalog?brand=${b.id}`}
              aria-label={b.name}
              className="group flex h-24 items-center justify-center rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-azure/30 hover:shadow-[var(--shadow-md)]"
            >
              <div className="relative h-11 w-full opacity-65 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0">
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
