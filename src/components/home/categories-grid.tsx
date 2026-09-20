import Image from 'next/image'
import Link from 'next/link'
import { type CatalogSectionView } from '@/lib/queries/categories'

const CATEGORY_PHOTOS: Record<string, string> = {
  mikrokontrollery: '/storefront/objects-v2/category-mcu.png',
  'passivnye-komponenty': '/storefront/objects-v2/category-passives.png',
  datchiki: '/storefront/category-sensors.jpg',
  'atsp-tsap': '/storefront/category-converters.jpg',
  pitanie: '/storefront/objects-v2/category-power.png',
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
    <section className="bg-white pb-3 pt-4 lg:pb-5 lg:pt-6" data-motion-reveal>
      <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
        <div className={`no-scrollbar grid auto-cols-[156px] grid-flow-col gap-3 overflow-x-auto pb-1 lg:auto-cols-auto lg:grid-flow-row lg:gap-6 lg:overflow-visible ${featuredSections.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
          {featuredSections.map((section) => {
            const children = section.children.slice(0, 4)

            return (
              <article
                key={section.id}
                className="min-w-0 overflow-hidden rounded-xl bg-white lg:overflow-visible"
              >
                <h2 className="hidden text-[16px] font-bold leading-tight text-ink lg:mb-4 lg:block">
                  {section.name}
                </h2>
                <div className="lg:flex lg:items-start lg:gap-4">
                <Link
                  href={`/catalog?category=${section.slug}`}
                  className="group block shrink-0"
                >
                  <div className="relative h-[96px] overflow-hidden rounded-xl border border-black/6 bg-white lg:size-[104px]">
                    <Image
                      src={categoryPhoto(section.slug)}
                      alt={section.name}
                      fill
                      loading="eager"
                      fetchPriority="high"
                      className="object-contain p-3 transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105"
                      sizes="(min-width: 1024px) 104px, 156px"
                    />
                  </div>
                  <div className="flex min-h-12 items-center px-3 py-2 lg:hidden">
                    <h3 className="text-[13px] font-bold leading-[1.08] text-ink transition-colors group-hover:text-azure">
                      {section.name}
                    </h3>
                  </div>
                </Link>

                {children.length > 0 ? (
                  <ul className="hidden min-w-0 flex-1 lg:block">
                    {children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/catalog?category=${child.slug}`}
                          className="block py-1 text-[14px] leading-[1.25] text-ink-3 transition-colors hover:text-azure"
                        >
                          <span className="line-clamp-1">{child.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="hidden min-w-0 pt-1 text-[13px] text-ink-3 lg:block">
                    <p>Позиций в каталоге: {section.productCount}</p>
                    <Link href={`/catalog?category=${section.slug}`} className="mt-3 inline-block font-medium text-ink-2 hover:text-azure">Все товары →</Link>
                  </div>
                )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
