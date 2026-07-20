import Image from 'next/image'
import Link from 'next/link'
import { FileText, Package, Sparkles } from 'lucide-react'
import { formatPrice, isNewProduct } from '@/lib/catalog-utils'
import { CompareToggleBtn } from '@/components/catalog/compare-toggle-btn'
import { AddToCartBtn } from './add-to-cart-btn'

interface ProductRowData {
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
  images: string[]
  specs: Record<string, string>
  inStock: boolean
  stockCount: number
  unit: string
}

export function ProductRow({ product }: { product: ProductRowData }) {
  return (
    <article className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-3 transition-colors hover:border-[var(--border-2)] sm:grid-cols-[104px_minmax(0,1fr)_190px] sm:gap-4 sm:p-4">
      <ProductImage product={product} />
      <ProductDetails product={product} />
      <ProductCommerce product={product} />
    </article>
  )
}

function ProductImage({ product }: { product: ProductRowData }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-surface-muted"
    >
      {product.images[0] ? (
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-contain p-2"
          sizes="(max-width: 640px) 76px, 104px"
        />
      ) : (
        <Package size={30} strokeWidth={1.4} className="text-ink-4" />
      )}
    </Link>
  )
}

function ProductDetails({ product }: { product: ProductRowData }) {
  const specs = Object.entries(product.specs).slice(0, 4)
  const isNew = isNewProduct(product.lastEnrichedAt)

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-3">
        <span>{product.manufacturer}</span>
        <span className="mpn font-semibold text-azure">{product.partNumber}</span>
        {isNew && (
          <span className="inline-flex items-center gap-1 rounded bg-stock-bg px-1.5 py-0.5 font-semibold text-stock">
            <Sparkles size={10} />
            Новинка
          </span>
        )}
        {product.lifecycle && <LifecycleBadge lifecycle={product.lifecycle} />}
      </div>
      <Link
        href={`/product/${product.slug}`}
        className="mt-1 block text-sm font-semibold leading-snug text-ink transition-colors hover:text-azure sm:text-[15px]"
      >
        {product.name}
      </Link>
      {specs.length > 0 ? (
        <dl className="mt-2 grid gap-x-4 gap-y-1 text-[11px] sm:grid-cols-2">
          {specs.map(([key, value]) => (
            <div key={key} className="flex min-w-0 gap-1.5">
              <dt className="shrink-0 text-ink-4">{key}:</dt>
              <dd className="truncate text-ink-2">{value}</dd>
            </div>
          ))}
        </dl>
      ) : product.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-3">
          {product.description}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-ink-3">
        {product.package && <span>Корпус: {product.package}</span>}
        {product.datasheets?.[0] && (
          <a
            href={product.datasheets[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-azure hover:underline"
          >
            <FileText size={12} />
            Datasheet
          </a>
        )}
      </div>
    </div>
  )
}

function ProductCommerce({ product }: { product: ProductRowData }) {
  const displayPrice = product.price === 0 ? null : product.price
  const stockLabel = product.inStock
    ? product.stockCount > 0
      ? `В наличии: ${product.stockCount.toLocaleString('ru-RU')} ${product.unit}`
      : 'В наличии'
    : 'Под заказ'

  return (
    <div className="col-span-2 flex items-end justify-between gap-3 border-t border-[var(--border)] pt-3 sm:col-span-1 sm:flex-col sm:items-stretch sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
      <div className="sm:text-right">
        <div className={displayPrice ? 'price text-lg' : 'text-sm font-semibold text-ink-3'}>
          {formatPrice(displayPrice)}
        </div>
        <div className={`mt-1 text-[11px] ${product.inStock ? 'text-stock' : 'text-ink-3'}`}>
          {stockLabel}
        </div>
        <div className="text-[10px] text-ink-4">Минимум: {product.minOrder} {product.unit}</div>
      </div>
      <div className="flex items-center justify-end gap-2">
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

function LifecycleBadge({ lifecycle }: { lifecycle: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-stock-bg text-stock',
    EOL: 'bg-red-50 text-red-700',
    NRND: 'bg-amber-50 text-amber-700',
  }

  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[lifecycle] || 'bg-surface-muted text-ink-3'}`}>
      {lifecycle}
    </span>
  )
}
