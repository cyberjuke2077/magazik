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
      className={`group relative flex flex-col items-center justify-center bg-[#0d0f1e] border border-white/6 rounded-xl overflow-hidden card-hover text-center ${
        size === 'large' ? 'p-6 gap-3' : 'p-4 gap-2'
      }`}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Icon */}
      <div className={`relative font-mono text-[#22d3ee] opacity-50 group-hover:opacity-80 transition-all duration-300 group-hover:scale-110 ${
        size === 'large' ? 'text-4xl' : 'text-2xl'
      }`}>
        {category.icon}
      </div>

      {/* Name */}
      <div className={`relative font-semibold text-[#f1f5f9] transition-colors ${
        size === 'large' ? 'text-base' : 'text-sm'
      }`}>
        {category.name}
      </div>

      {/* Count */}
      <div className="relative text-[10px] text-[#64748b] group-hover:text-[#94a3b8] transition-colors">
        {formatNumber(category.count)} позиций
      </div>
    </Link>
  )
}
