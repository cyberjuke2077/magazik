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
      className={`group relative flex flex-col items-center justify-center bg-white border border-black/8 rounded overflow-hidden card-hover text-center shadow-sm ${
        size === 'large' ? 'p-6 gap-3' : 'p-4 gap-2'
      }`}
    >
      {/* Hover background */}
      <div className="absolute inset-0 bg-azure/0 group-hover:bg-azure/4 transition-all duration-300" />

      {/* Top accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-azure scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Icon */}
      <div className={`relative font-mono text-azure opacity-40 group-hover:opacity-80 transition-all duration-300 group-hover:scale-110 ${
        size === 'large' ? 'text-4xl' : 'text-2xl'
      }`}>
        {category.icon}
      </div>

      {/* Name */}
      <div className={`relative font-semibold text-[#1c1917] group-hover:text-azure transition-colors ${
        size === 'large' ? 'text-base' : 'text-sm'
      }`}>
        {category.name}
      </div>

      {/* Count */}
      <div className="relative text-[10px] text-[#a8a29e] group-hover:text-[#78716c] transition-colors">
        {formatNumber(category.count)} позиций
      </div>
    </Link>
  )
}
