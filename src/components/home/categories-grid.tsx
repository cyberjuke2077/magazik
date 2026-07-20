import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { type CatalogSectionView } from '@/lib/queries/categories'

const CATEGORY_PHOTOS = [
  '/photos/cat-1.jpg',
  '/photos/cat-2.jpg',
  '/photos/cat-3.jpg',
  '/photos/cat-4.jpg',
  '/photos/cat-5.jpg',
  '/photos/cat-6.jpg',
  '/photos/hero.jpg',
]

export function CategoriesGrid({ sections }: { sections: CatalogSectionView[] }) {
  const [featuredSection, ...compactSections] = sections.slice(0, 7)
  if (!featuredSection) return null

  return (
    <section className="bg-canvas py-5">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-4">Каталог</p>
            <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[26px]">
              Компоненты по назначению
            </h2>
          </div>
          <Link
            href="/catalog"
            className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 py-2 text-sm font-semibold text-azure hover:underline"
          >
            Весь каталог
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:grid-rows-2">
          <Link
            href={`/catalog?category=${featuredSection.slug}`}
            className="group relative col-span-2 min-h-[190px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[#dfe5e9] lg:col-span-1 lg:row-span-2 lg:min-h-[264px]"
          >
            <Image
              src={CATEGORY_PHOTOS[0]}
              alt={featuredSection.name}
              fill
              className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.025]"
              sizes="(max-width: 1024px) 100vw, 350px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151c28]/92 via-[#151c28]/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <h3 className="text-lg font-bold leading-tight">{featuredSection.name}</h3>
              <p className="mt-1 text-xs text-white/72">
                {featuredSection.productCount.toLocaleString('ru-RU')} позиций
              </p>
            </div>
          </Link>

          {compactSections.map((section, index) => (
            <Link
              key={section.id}
              href={`/catalog?category=${section.slug}`}
              className="group grid min-h-[154px] grid-rows-[72px_minmax(0,1fr)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white transition-colors hover:border-[var(--border-2)] sm:min-h-[126px] sm:grid-cols-[minmax(0,1fr)_92px] sm:grid-rows-none"
            >
              <div className="order-2 flex min-w-0 flex-col justify-center p-3 sm:order-1 sm:p-3.5">
                <h3 className="text-[13px] font-bold leading-snug text-ink transition-colors group-hover:text-azure sm:text-sm">
                  {section.name}
                </h3>
                <p className="mt-1 text-[11px] tabular-nums text-ink-4 sm:text-xs">
                  {section.productCount.toLocaleString('ru-RU')} позиций
                </p>
                {section.children.length > 0 && (
                  <p className="mt-2 hidden text-xs text-ink-3 sm:line-clamp-1">
                    {section.children.slice(0, 2).map((child) => child.name).join(', ')}
                  </p>
                )}
              </div>
              <div className="relative order-1 bg-surface-muted sm:order-2">
                <Image
                  src={CATEGORY_PHOTOS[index + 1]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="92px"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
