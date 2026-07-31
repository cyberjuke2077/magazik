import Link from 'next/link'
import { type Category } from '@/types'
import { formatNumber } from '@/lib/utils'

interface CategoryCardProps {
  category: Category
  size?: 'default' | 'large'
}

export function CategoryCard({ category, size = 'default' }: CategoryCardProps) {
  return (
    <Link
      href={`/catalog?category=${category.slug}`}
      className={`group flex flex-col items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white text-center transition-colors hover:border-[var(--border-2)] ${
        size === 'large' ? 'p-6 gap-3' : 'p-4 gap-2'
      }`}
    >
      {/* Icon */}
      <div className={`font-mono text-azure opacity-60 transition-opacity duration-200 group-hover:opacity-90 ${
        size === 'large' ? 'text-4xl' : 'text-2xl'
      }`}>
        {category.icon}
      </div>

      {/* Name */}
      <div className={`font-semibold text-ink transition-colors group-hover:text-azure ${
        size === 'large' ? 'text-base' : 'text-sm'
      }`}>
        {category.name}
      </div>

      {/* Count */}
      <div className="text-[10px] text-ink-4 transition-colors group-hover:text-ink-3">
        {formatNumber(category.count)} позиций
      </div>
    </Link>
  )
}
