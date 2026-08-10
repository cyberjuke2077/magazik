'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { type CategoryWithCount } from '@/lib/queries/categories'

interface CategoryTreeProps {
  categories: CategoryWithCount[]
  activeSlug: string | null
}

function filterCategories(categories: CategoryWithCount[], term: string): CategoryWithCount[] {
  const normalized = term.trim().toLocaleLowerCase('ru-RU')
  if (!normalized) return categories

  return categories.flatMap((category) => {
    const children = filterCategories(category.children, normalized)
    const matches = category.name.toLocaleLowerCase('ru-RU').includes(normalized)

    return matches || children.length > 0 ? [{ ...category, children }] : []
  })
}

function CategoryNode({
  category,
  activeSlug,
  onSelect,
  depth,
}: {
  category: CategoryWithCount
  activeSlug: string | null
  onSelect: (slug: string | null) => void
  depth: number
}) {
  const [expanded, setExpanded] = useState(
    // Auto-expand if this category or a child is active
    category.slug === activeSlug ||
    category.children.some((c) => c.slug === activeSlug),
  )
  const hasChildren = category.children.length > 0
  const isActive = category.slug === activeSlug

  function handleClick() {
    if (isActive) {
      onSelect(null)
    } else {
      onSelect(category.slug)
    }
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 cursor-pointer text-sm transition-colors rounded ${
          isActive
            ? 'bg-azure-light text-azure font-semibold'
            : 'text-ink-2 hover:bg-[#fafafa] hover:text-ink'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-4 h-4 shrink-0 text-ink-4"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="flex-1 truncate">{category.name}</span>
        {category.productCount > 0 && (
          <span className="text-xs text-ink-4 shrink-0">
            {category.productCount}
          </span>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              activeSlug={activeSlug}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTree({ categories, activeSlug }: CategoryTreeProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filterTerm, setFilterTerm] = useState('')
  const visibleCategories = filterCategories(categories, filterTerm)

  function handleSelect(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    // Reset page when changing category
    params.delete('page')
    router.replace(`/catalog?${params.toString()}`)
  }

  return (
    <div className="space-y-0.5">
      <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-ink-3">
        Категории
      </div>
      <div className="relative mb-2 px-2">
        <Search
          size={13}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-4"
        />
        <input
          type="search"
          value={filterTerm}
          onChange={(event) => setFilterTerm(event.target.value)}
          placeholder="Поиск по категориям"
          aria-label="Поиск по категориям"
          className="h-8 w-full rounded-lg border border-[var(--border)] bg-surface-muted pl-7 pr-2 text-xs text-ink-2 transition-colors placeholder:text-ink-4 focus:border-azure focus:bg-white focus:outline-none"
        />
      </div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 cursor-pointer text-sm transition-colors rounded ${
          !activeSlug
            ? 'bg-azure-light text-azure font-semibold'
            : 'text-ink-2 hover:bg-[#fafafa] hover:text-ink'
        }`}
        onClick={() => handleSelect(null)}
      >
        <span className="w-4 shrink-0" />
        <span className="flex-1">Все категории</span>
      </div>
      {visibleCategories.map((cat) => (
        <CategoryNode
          key={cat.id}
          category={cat}
          activeSlug={activeSlug}
          onSelect={handleSelect}
          depth={0}
        />
      ))}
      {visibleCategories.length === 0 && (
        <div className="px-2 py-3 text-xs text-ink-4">Категории не найдены</div>
      )}
    </div>
  )
}
