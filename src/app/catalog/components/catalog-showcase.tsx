import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CategoryIcon } from '@/components/ui/component-icons'
import { type CatalogSectionView } from '@/lib/queries/categories'

interface CatalogShowcaseProps {
  sections: CatalogSectionView[]
}

function formatCount(n: number): string {
  return n.toLocaleString('ru-RU')
}

/**
 * Витрина каталога в стиле ChipDip: карточка раздела с иконкой, счётчиком
 * и списком подкатегорий. Показывается на /catalog, когда не выбран ни один
 * фильтр (категория / производитель / поиск).
 */
export function CatalogShowcase({ sections }: CatalogShowcaseProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sections.map((section) => {
        const shownChildren = section.children.slice(0, 6)
        const restChildren = section.children.length - shownChildren.length

        return (
          <div
            key={section.id}
            className="group flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-[#0066cc]/40 hover:shadow-sm transition-all"
          >
            {/* Header — иконка + название + счётчик */}
            <Link
              href={`/catalog?category=${section.slug}`}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-gray-50/60 group-hover:bg-[#e8f4ff]/50 transition-colors"
            >
              <span className="flex items-center justify-center size-11 shrink-0 rounded-md bg-white border border-gray-200 text-[#0066cc]">
                <CategoryIcon slug={section.icon ?? section.slug} size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-gray-900 group-hover:text-[#0066cc] transition-colors leading-tight">
                  {section.name}
                </span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  {formatCount(section.productCount)} позиций
                </span>
              </span>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0066cc] shrink-0 transition-colors" />
            </Link>

            {/* Подкатегории */}
            {shownChildren.length > 0 && (
              <ul className="flex-1 px-2 py-2">
                {shownChildren.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/catalog?category=${child.slug}`}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm text-gray-600 rounded hover:bg-gray-50 hover:text-[#0066cc] transition-colors"
                    >
                      <span className="truncate">{child.name}</span>
                      <span className="text-xs text-gray-400 shrink-0">{formatCount(child.productCount)}</span>
                    </Link>
                  </li>
                ))}
                {restChildren > 0 && (
                  <li>
                    <Link
                      href={`/catalog?category=${section.slug}`}
                      className="block px-2 py-1.5 text-sm font-medium text-[#0066cc] hover:underline"
                    >
                      Ещё {restChildren}…
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
