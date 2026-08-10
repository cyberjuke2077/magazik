import Link from 'next/link'
import { type CategoryWithCount } from '@/lib/queries/categories'

function categoryTotal(category: CategoryWithCount): number {
  return category.productCount + category.children.reduce((sum, child) => sum + categoryTotal(child), 0)
}

function filterContext(categories: CategoryWithCount[], activeSlug: string | null) {
  if (!activeSlug) {
    return { options: categories, allHref: '/catalog', allLabel: 'Все разделы', allActive: true }
  }

  const activeRoot = categories.find((category) => category.slug === activeSlug)
  if (activeRoot?.children.length) {
    return {
      options: activeRoot.children,
      allHref: `/catalog?category=${encodeURIComponent(activeRoot.slug)}`,
      allLabel: 'Все в разделе',
      allActive: true,
    }
  }

  const parent = categories.find((category) =>
    category.children.some((child) => child.slug === activeSlug),
  )

  if (parent?.children.length) {
    return {
      options: parent.children,
      allHref: `/catalog?category=${encodeURIComponent(parent.slug)}`,
      allLabel: 'Все в разделе',
      allActive: false,
    }
  }

  return { options: categories, allHref: '/catalog', allLabel: 'Все разделы', allActive: false }
}

export function CatalogQuickFilters({
  categories,
  activeSlug,
}: {
  categories: CategoryWithCount[]
  activeSlug: string | null
}) {
  const context = filterContext(categories, activeSlug)
  const options = [...context.options]
    .filter((category) => categoryTotal(category) > 0)
    .sort((a, b) => categoryTotal(b) - categoryTotal(a) || a.name.localeCompare(b.name))
    .slice(0, 10)

  if (options.length === 0) return null

  return (
    <div
      className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-3"
      aria-label="Быстрые фильтры каталога"
      data-catalog-quick-filters
    >
      <Link
        href={context.allHref}
        className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
          context.allActive
            ? 'bg-azure text-white'
            : 'bg-surface-muted text-ink-2 hover:bg-azure-light hover:text-azure'
        }`}
      >
        {context.allLabel}
      </Link>
      {options.map((category) => {
        const active = category.slug === activeSlug

        return (
          <Link
            key={category.id}
            href={`/catalog?category=${encodeURIComponent(category.slug)}`}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
              active
                ? 'bg-azure text-white'
                : 'bg-surface-muted text-ink-2 hover:bg-azure-light hover:text-azure'
            }`}
          >
            {category.name}
          </Link>
        )
      })}
    </div>
  )
}
