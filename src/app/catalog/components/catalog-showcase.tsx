import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/component-icons'
import { type CatalogSectionView } from '@/lib/queries/categories'

interface CatalogShowcaseProps {
  sections: CatalogSectionView[]
}

const CATEGORY_PHOTOS: Record<string, string> = {
  mikrokontrollery: '/storefront/category-mcu.jpg',
  datchiki: '/storefront/category-sensors.jpg',
  'atsp-tsap': '/storefront/category-converters.jpg',
  pitanie: '/storefront/category-power.jpg',
  usiliteli: '/storefront/category-amplifiers.jpg',
  interfeysy: '/storefront/category-interfaces.jpg',
  rch: '/storefront/category-rf.jpg',
}

function categoryPhoto(slug: string): string {
  return CATEGORY_PHOTOS[slug] ?? '/storefront/category-interfaces.jpg'
}

function formatCount(n: number): string {
  return n.toLocaleString('ru-RU')
}

/**
 * Плотная витрина каталога: карточка раздела с иконкой, счётчиком
 * и списком подкатегорий. Показывается на /catalog, когда не выбран ни один
 * фильтр (категория / производитель / поиск).
 */
export function CatalogShowcase({ sections }: CatalogShowcaseProps) {
  return (
    <div className="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-motion-reveal>
      {sections.map((section, index) => {
        const shownChildren = section.children.slice(0, 6)
        const restChildren = section.children.length - shownChildren.length

        return (
          <article
            key={section.id}
            className="group grid min-h-[250px] grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-xs)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-azure-md)] active:translate-y-0"
          >
            <Link
              href={`/catalog?category=${section.slug}`}
              className="relative overflow-hidden bg-azure-dim"
            >
              <Image src={categoryPhoto(section.slug)} alt={section.name} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" sizes="112px" loading={index < 3 ? 'eager' : 'lazy'} />
              <span className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-xl bg-white/92 text-azure shadow-sm backdrop-blur-sm">
                <CategoryIcon slug={section.icon ?? section.slug} size={20} />
              </span>
            </Link>

            <div className="flex min-w-0 flex-col p-4">
              <Link href={`/catalog?category=${section.slug}`} className="flex items-start gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold leading-tight text-ink transition-colors group-hover:text-azure">{section.name}</span>
                  <span className="mt-1 block text-xs text-ink-4">{formatCount(section.productCount)} позиций</span>
                </span>
                <ChevronRight size={17} className="shrink-0 text-ink-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-azure" />
              </Link>
              {shownChildren.length > 0 && (
                <ul className="mt-3 flex-1">
                {shownChildren.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/catalog?category=${child.slug}`}
                      className="flex items-center justify-between gap-2 rounded-lg py-1.5 text-[13px] text-ink-3 transition-colors hover:text-azure"
                    >
                      <span className="truncate">{child.name}</span>
                      <span className="text-xs text-ink-4 shrink-0">{formatCount(child.productCount)}</span>
                    </Link>
                  </li>
                ))}
                {restChildren > 0 && (
                  <li>
                    <Link
                      href={`/catalog?category=${section.slug}`}
                      className="block px-2 py-1.5 text-sm font-medium text-azure hover:underline"
                    >
                      Ещё {restChildren}
                    </Link>
                  </li>
                )}
                </ul>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
