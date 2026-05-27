import Link from 'next/link'
import { FileText, Sparkles } from 'lucide-react'
import { formatPrice, isNewProduct } from '@/lib/catalog-utils'
import { AddToCartBtn } from './add-to-cart-btn'
import { CompareToggleBtn } from '@/components/catalog/compare-toggle-btn'

interface ProductRowProps {
  product: {
    id: string
    slug: string
    name: string
    partNumber: string
    manufacturer: string
    categorySlug?: string
    price: number
    minOrder: number
    package?: string | null
    lifecycle?: string | null
    description?: string
    lastEnrichedAt?: string | null
    datasheets?: Array<{ id: string; title: string; url: string }>
  }
}

function LifecycleBadge({ lifecycle }: { lifecycle: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-green-50 text-green-700 border-green-200',
    EOL: 'bg-red-50 text-red-700 border-red-200',
    NRND: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  }
  const style = styles[lifecycle] || 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <span className={`inline-flex items-center h-4 px-1.5 text-[10px] font-medium border rounded ${style}`}>
      {lifecycle}
    </span>
  )
}

export function ProductRow({ product }: ProductRowProps) {
  const displayPrice = product.price === 0 ? null : product.price
  const isNew = isNewProduct(product.lastEnrichedAt)
  const truncatedDesc = product.description
    ? product.description.length > 80
      ? product.description.slice(0, 80) + '…'
      : product.description
    : null

  return (
    <div className="flex items-center gap-4 min-h-[60px] px-4 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
      {/* MPN */}
      <div className="w-[140px] shrink-0">
        <Link
          href={`/product/${product.slug}`}
          className="text-sm font-bold text-[#0066cc] hover:underline truncate block"
        >
          {product.partNumber}
        </Link>
        {truncatedDesc && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5 leading-tight">
            {truncatedDesc}
          </p>
        )}
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/product/${product.slug}`}
            className="text-sm text-gray-800 truncate hover:text-[#0066cc] transition-colors"
          >
            {product.name}
          </Link>
          {isNew && (
            <span className="inline-flex items-center gap-0.5 h-4 px-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded shrink-0">
              <Sparkles size={9} />
              NEW
            </span>
          )}
          {product.lifecycle && (
            <span className="shrink-0">
              <LifecycleBadge lifecycle={product.lifecycle} />
            </span>
          )}
        </div>
      </div>

      {/* Manufacturer + package */}
      <div className="w-[140px] shrink-0 hidden md:block">
        <div className="text-xs text-gray-500 truncate">{product.manufacturer}</div>
        {product.package && (
          <div className="text-[10px] text-gray-400 truncate mt-0.5">
            {product.package}
          </div>
        )}
      </div>

      {/* Datasheet */}
      <div className="w-[30px] shrink-0 hidden lg:flex items-center justify-center">
        {product.datasheets && product.datasheets.length > 0 && (
          <a
            href={product.datasheets[0].url}
            target="_blank"
            rel="noopener noreferrer"
            title={product.datasheets[0].title || 'Datasheet'}
            className="text-gray-400 hover:text-[#0066cc] transition-colors"
          >
            <FileText size={14} />
          </a>
        )}
      </div>

      {/* Delivery */}
      <div className="w-[70px] shrink-0 text-xs text-gray-400 hidden lg:block">
        2–4 нед.
      </div>

      {/* Price */}
      <div className="w-[130px] shrink-0 text-right">
        <span className={`text-sm font-bold ${displayPrice ? 'text-gray-900' : 'text-gray-400 text-xs font-medium'}`}>
          {formatPrice(displayPrice)}
        </span>
      </div>

      {/* Compare */}
      <div className="shrink-0 hidden md:flex">
        <CompareToggleBtn
          item={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            partNumber: product.partNumber,
            manufacturer: product.manufacturer,
            categorySlug: product.categorySlug || '',
          }}
        />
      </div>

      {/* Add to cart */}
      <div className="shrink-0">
        <AddToCartBtn
          productId={product.id}
          partNumber={product.partNumber}
          name={product.name}
          manufacturer={product.manufacturer}
          minOrder={product.minOrder}
          price={displayPrice}
        />
      </div>
    </div>
  )
}
