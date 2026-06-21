'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { type CategoryWithCount } from '@/lib/queries/categories'

interface CategoryTreeProps {
  categories: CategoryWithCount[]
  activeSlug: string | null
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
      <div className="text-xs font-bold text-ink-3 uppercase tracking-wide px-2 mb-2">
        Категории
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
      {categories.map((cat) => (
        <CategoryNode
          key={cat.id}
          category={cat}
          activeSlug={activeSlug}
          onSelect={handleSelect}
          depth={0}
        />
      ))}
    </div>
  )
}
