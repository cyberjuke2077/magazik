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
 * Плотная витрина каталога: карточка раздела с иконкой, счётчиком
 * и списком подкатегорий. Показывается на /catalog, когда не выбран ни один
 * фильтр (категория / производитель / поиск).
 */
export function CatalogShowcase({ sections }: CatalogShowcaseProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => {
        const shownChildren = section.children.slice(0, 6)
        const restChildren = section.children.length - shownChildren.length

        return (
          <div
            key={section.id}
            className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white transition-colors hover:border-[var(--border-2)]"
          >
            {/* Header — иконка + название + счётчик */}
            <Link
              href={`/catalog?category=${section.slug}`}
              className="flex items-center gap-3 border-b border-[var(--border)] bg-surface-muted px-3 py-3 transition-colors group-hover:bg-azure-light/50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-white text-azure">
                <CategoryIcon slug={section.icon ?? section.slug} size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-tight text-ink transition-colors group-hover:text-azure">
                  {section.name}
                </span>
                <span className="block text-xs text-ink-4 mt-0.5">
                  {formatCount(section.productCount)} позиций
                </span>
              </span>
              <ChevronRight size={16} className="text-ink-4 group-hover:text-azure shrink-0 transition-colors" />
            </Link>

            {/* Подкатегории */}
            {shownChildren.length > 0 && (
              <ul className="flex-1 px-2 py-1.5">
                {shownChildren.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/catalog?category=${child.slug}`}
                      className="flex items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-ink-3 transition-colors hover:bg-surface-muted hover:text-azure"
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
