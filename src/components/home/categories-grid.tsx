import Image from 'next/image'
import Link from 'next/link'
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
    <section className="bg-white pb-2 pt-[18px] lg:pb-[29px] lg:pt-[29px]" data-motion-reveal>
      <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
        <div className="grid grid-flow-dense grid-cols-2 gap-3 lg:grid-cols-12 lg:gap-5">
          {featuredSections.map((section, index) => {
            const children = section.children.slice(0, 4)

            return (
              <article
                key={section.id}
                className={`min-w-0 overflow-hidden rounded-xl bg-surface-muted transition-colors hover:bg-azure-dim lg:col-span-3 lg:overflow-visible lg:rounded-2xl lg:bg-transparent lg:p-3 ${
                  index >= 2 ? 'hidden lg:block' : ''
                }`}
              >
                <h2 className="hidden text-[18px] font-bold leading-tight text-ink lg:mb-[26px] lg:block">
                  {section.name}
                </h2>
                <div className="lg:flex lg:items-start lg:gap-4">
                <Link
                  href={`/catalog?category=${section.slug}`}
                  className="group block shrink-0"
                >
                  <div className="relative h-[96px] overflow-hidden bg-white lg:size-[112px] lg:rounded-xl lg:border lg:border-[var(--border)]">
                    <Image
                      src={categoryPhoto(section.slug)}
                      alt={section.name}
                      fill
                      className="object-cover saturate-[1.18] contrast-[1.04] brightness-[1.08] transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 112px"
                    />
                  </div>
                  <div className="flex min-h-12 items-center px-3 py-2 lg:hidden">
                    <h3 className="text-[13px] font-bold leading-[1.08] text-ink transition-colors group-hover:text-azure">
                      {section.name}
                    </h3>
                  </div>
                </Link>

                {children.length > 0 && (
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
