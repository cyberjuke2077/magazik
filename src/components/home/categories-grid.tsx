import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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
  const featuredSections = sections.slice(0, 6)
  if (featuredSections.length === 0) return null

  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.035em] text-ink sm:text-3xl">Категории компонентов</h2>
            <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-3 sm:text-base">
              Переходите к нужной группе или найдите деталь по маркировке.
            </p>
          </div>
          <Link href="/catalog" className="hidden items-center gap-2 text-sm font-semibold text-azure hover:text-azure-hover sm:flex">
            Весь каталог
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid border-t border-[var(--border)] md:grid-cols-2">
          {featuredSections.map((section) => {
            const children = section.children.slice(0, 4)

            return (
              <article
                key={section.id}
                className="group min-w-0 border-b border-[var(--border)] py-5 md:odd:pr-8 md:even:border-l md:even:pl-8"
              >
                <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                <Link
                  href={`/catalog?category=${section.slug}`}
                  className="block shrink-0"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-control)] bg-surface-muted">
                    <Image
                      src={categoryPhoto(section.slug)}
                      alt={section.name}
                      fill
                      className="object-cover saturate-[0.78] transition-transform duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.03]"
                      sizes="96px"
                    />
                  </div>
                </Link>

                <div className="min-w-0 py-0.5">
                  <Link href={`/catalog?category=${section.slug}`} className="inline-flex items-center gap-2">
                    <h3 className="text-base font-semibold leading-tight text-ink transition-colors group-hover:text-azure sm:text-lg">
                      {section.name}
                    </h3>
                    <ArrowRight size={15} className="text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-azure" />
                  </Link>
                  {children.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/catalog?category=${child.slug}`}
                          className="block text-[13px] leading-[1.5] text-ink-3 transition-colors hover:text-azure"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  )}
                </div>
                </div>
              </article>
            )
          })}
        </div>
        <Link href="/catalog" className="mt-6 flex items-center gap-2 text-sm font-semibold text-azure sm:hidden">
          Весь каталог
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
