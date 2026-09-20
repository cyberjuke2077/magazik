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
  const featuredSections = sections.slice(0, 8)
  if (featuredSections.length === 0) return null

  return (
    <section className="storefront-container py-9 sm:py-12" aria-labelledby="categories-title">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="categories-title" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Что ищете?</h2>
        <Link href="/catalog" className="text-sm font-semibold text-azure hover:underline">Все категории</Link>
      </div>
      <div className="category-grid grid grid-flow-dense grid-cols-2 gap-3">
        {featuredSections.map((section, index) => (
          <Link key={section.id} href={`/catalog?category=${section.slug}`} className={`group flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-3 transition duration-200 hover:border-azure/30 hover:shadow-sm sm:p-4 ${featuredSections.length % 2 === 1 && index === featuredSections.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:size-20">
              <Image src={categoryPhoto(section.slug)} alt="" fill loading="lazy" className="object-cover transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-105" sizes="80px" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-snug text-ink transition-colors group-hover:text-azure sm:text-sm">{section.name}</h3>
              <span className="mt-1 hidden text-xs text-ink-3 sm:block">Смотреть компоненты</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
