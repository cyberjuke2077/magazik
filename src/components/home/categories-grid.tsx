import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { type CatalogSectionView } from '@/lib/queries/categories'

const CATEGORY_PHOTOS: Record<string, string> = {
  mikrokontrollery: '/storefront/category-mcu.jpg',
  datchiki: '/storefront/category-sensors.jpg',
  'atsp-tsap': '/storefront/category-converters.jpg',
  pitanie: '/storefront/category-power.jpg',
  usiliteli: '/storefront/category-amplifiers.jpg',
  interfeysy: '/storefront/category-interfaces.jpg',
  rch: '/storefront/category-rf.jpg',
  induktivnosti: '/storefront/category-power.jpg',
}

function categoryPhoto(slug: string): string {
  return CATEGORY_PHOTOS[slug] ?? '/storefront/category-interfaces.jpg'
}

export function CategoriesGrid({ sections }: { sections: CatalogSectionView[] }) {
  const featuredSections = sections.slice(0, 4)
  if (featuredSections.length === 0) return null

  return (
    <section className="bg-canvas py-5">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[26px]">
            Популярные разделы
          </h2>
          <Link
            href="/catalog"
            className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 py-2 text-sm font-semibold text-azure hover:underline"
          >
            Весь каталог
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {featuredSections.map((section) => {
            const children = section.children.slice(0, 4)

            return (
              <article
                key={section.id}
                className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white"
              >
                <Link
                  href={`/catalog?category=${section.slug}`}
                  className="group block"
                >
                  <div className="relative h-[142px] overflow-hidden bg-[#edf0f2]">
                    <Image
                      src={categoryPhoto(section.slug)}
                      alt={section.name}
                      fill
                      className="object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.025]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 350px"
                    />
                  </div>
                  <div className="border-b border-[var(--border)] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[15px] font-bold leading-tight text-ink transition-colors group-hover:text-azure">
                          {section.name}
                        </h3>
                        <p className="mt-1 text-xs tabular-nums text-ink-4">
                          {section.productCount.toLocaleString('ru-RU')} позиций
                        </p>
                      </div>
                      <ChevronRight size={17} className="mt-0.5 shrink-0 text-ink-4 transition-colors group-hover:text-azure" />
                    </div>
                  </div>
                </Link>

                {children.length > 0 && (
                  <ul className="px-2 py-2">
                    {children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/catalog?category=${child.slug}`}
                          className="flex min-h-9 items-center justify-between gap-2 rounded-[6px] px-2 text-[13px] text-ink-3 transition-colors hover:bg-surface-muted hover:text-azure"
                        >
                          <span className="line-clamp-1">{child.name}</span>
                          <span className="shrink-0 text-[11px] tabular-nums text-ink-4">
                            {child.productCount.toLocaleString('ru-RU')}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
