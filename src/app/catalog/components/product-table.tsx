'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { formatPrice } from '@/lib/catalog-utils'
import { BulkSelectCheckbox } from './bulk-select-panel'
import { AddToCartBtn } from './add-to-cart-btn'

interface ProductTableProps {
  products: Array<{
    id: string
    slug: string
    name: string
    partNumber: string
    manufacturer: string
    price: number
    minOrder: number
    package?: string | null
    lifecycle?: string | null
    lastEnrichedAt?: string | null
  }>
}

type SortKey = 'partNumber' | 'name' | 'manufacturer'

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  currentSort: string
  onSort: (key: SortKey) => void
  className?: string
}) {
  const isActive = currentSort === sortKey

  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors ${className || ''}`}
    >
      {label}
      {isActive ? (
        <ArrowUp size={10} className="text-[#0066cc]" />
      ) : (
        <ArrowUpDown size={10} className="text-gray-300" />
      )}
    </button>
  )
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'date'

  function handleSort(key: SortKey) {
    const params = new URLSearchParams(searchParams.toString())
    if (currentSort === key) {
      // Already sorted by this — reset to default
      params.delete('sort')
    } else {
      params.set('sort', key)
    }
    params.delete('page')
    const qs = params.toString()
    router.replace(`/catalog${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="w-[36px] px-2 py-2" />
            <th className="text-left px-2 py-2 w-[130px]">
              <SortableHeader
                label="Артикул"
                sortKey="partNumber"
                currentSort={currentSort}
                onSort={handleSort}
              />
            </th>
            <th className="text-left px-2 py-2">
              <SortableHeader
                label="Наименование"
                sortKey="name"
                currentSort={currentSort}
                onSort={handleSort}
              />
            </th>
            <th className="text-left px-2 py-2 w-[130px] hidden md:table-cell">
              <SortableHeader
                label="Производитель"
                sortKey="manufacturer"
                currentSort={currentSort}
                onSort={handleSort}
              />
            </th>
            <th className="text-left px-2 py-2 w-[90px] hidden lg:table-cell">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Корпус
              </span>
            </th>
            <th className="text-right px-2 py-2 w-[110px]">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Цена
              </span>
            </th>
            <th className="px-2 py-2 w-[200px]">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Действие
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const displayPrice = product.price === 0 ? null : product.price

            return (
              <tr
                key={product.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors h-[40px]"
              >
                {/* Checkbox */}
                <td className="px-2">
                  <BulkSelectCheckbox productId={product.id} />
                </td>

                {/* Part number */}
                <td className="px-2">
                  <Link
                    href={`/product/${product.slug}`}
                    className="text-sm font-bold text-[#0066cc] hover:underline truncate block"
                  >
                    {product.partNumber}
                  </Link>
                </td>

                {/* Name */}
                <td className="px-2">
                  <Link
                    href={`/product/${product.slug}`}
                    className="text-sm text-gray-800 truncate block hover:text-[#0066cc] transition-colors"
                  >
                    {product.name}
                  </Link>
                </td>

                {/* Manufacturer */}
                <td className="px-2 hidden md:table-cell">
                  <span className="text-xs text-gray-500 truncate block">
                    {product.manufacturer}
                  </span>
                </td>

                {/* Package */}
                <td className="px-2 hidden lg:table-cell">
                  <span className="text-xs text-gray-400 truncate block">
                    {product.package || '—'}
                  </span>
                </td>

                {/* Price */}
                <td className="px-2 text-right">
                  <span className={`text-sm font-bold ${displayPrice ? 'text-gray-900' : 'text-gray-400 text-xs font-medium'}`}>
                    {formatPrice(displayPrice)}
                  </span>
                </td>

                {/* Action */}
                <td className="px-2">
                  <AddToCartBtn
                    productId={product.id}
                    partNumber={product.partNumber}
                    name={product.name}
                    manufacturer={product.manufacturer}
                    minOrder={product.minOrder}
                    price={displayPrice}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
