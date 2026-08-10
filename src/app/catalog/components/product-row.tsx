import Image from 'next/image'
import Link from 'next/link'
import { FileText, Sparkles } from 'lucide-react'
import { formatPrice, isNewProduct } from '@/lib/catalog-utils'
import { fallbackImageForProduct } from '@/lib/enrichment/images/package-image'
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

export function ProductRow({ product, priority = false }: { product: ProductRowData; priority?: boolean }) {
  return (
    <article
      data-catalog-product-row
      className="group grid grid-cols-[84px_minmax(0,1fr)] gap-3 rounded-2xl border border-transparent bg-white p-3 shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] duration-300 hover:border-azure/10 hover:shadow-[var(--shadow-azure-md)] sm:min-h-[250px] sm:grid-cols-[210px_minmax(0,1fr)_220px] sm:gap-6 sm:p-5"
    >
      <ProductImage product={product} priority={priority} />
      <ProductDetails product={product} />
      <ProductCommerce product={product} />
    </article>
  )
}

function ProductImage({ product, priority }: { product: ProductRowData; priority: boolean }) {
  const image = product.images[0] ?? fallbackImageForProduct({
    package: product.package,
    partNumber: product.partNumber,
    name: product.name,
  })

  return (
    <div className="min-w-0">
      <Link
        href={`/product/${product.slug}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-surface-muted"
      >
        <Image
          src={image}
          alt={product.name}
          fill
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 76px, 192px"
        />
      </Link>
      <div
        data-catalog-product-code
        className="mpn mt-2 hidden truncate px-1 text-[10px] text-ink-4 opacity-0 transition-[opacity,transform,color] duration-200 group-hover:translate-y-0 group-hover:text-ink-3 group-hover:opacity-100 sm:block sm:-translate-y-1"
      >
        Код товара {product.partNumber}
      </div>
    </div>
  )
}

function ProductDetails({ product }: { product: ProductRowData }) {
  const specs = Object.entries(product.specs)
    .filter(([key, value]) => key.trim().toLowerCase() !== 'нет данных' && value.trim().length > 0)
    .slice(0, 4)
  const description = product.description?.trim()
  const hasUsefulDescription = Boolean(description && description.toLowerCase() !== 'нет данных')
  const isNew = isNewProduct(product.lastEnrichedAt)

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-3">
        <span className="font-medium">{product.manufacturer}</span>
        <span className="mpn font-semibold text-azure sm:hidden">{product.partNumber}</span>
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
        className="mt-1 block text-sm font-semibold leading-snug tracking-[-0.01em] text-ink transition-colors hover:text-azure sm:text-[17px]"
      >
        {product.name}
      </Link>
      {specs.length > 0 ? (
        <dl className="mt-2 hidden gap-x-4 gap-y-1 text-[11px] sm:grid sm:grid-cols-2">
          {specs.map(([key, value]) => (
            <div key={key} className="flex min-w-0 gap-1.5">
              <dt className="shrink-0 text-ink-4">{key}:</dt>
              <dd className="truncate text-ink-2">{value}</dd>
            </div>
          ))}
        </dl>
      ) : hasUsefulDescription ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-3">
          {description}
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-4">Характеристики уточняются</p>
      )}
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

  return (
    <div className="col-span-2 flex items-end justify-between gap-3 border-t border-[var(--border)] pt-3 sm:col-span-1 sm:flex-col sm:items-stretch sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
      <div className="sm:text-right">
        <div className={displayPrice ? 'price text-xl' : 'text-base font-bold text-ink'}>
          {formatPrice(displayPrice)}
        </div>
        <div className="text-[10px] text-ink-4">Минимум: {product.minOrder} {product.unit}</div>
      </div>
      <div className="mt-auto hidden text-right text-xs sm:block">
        <div className={product.inStock ? 'font-medium text-stock' : 'font-medium text-ink-3'}>
          {product.inStock
            ? `В наличии${product.stockCount > 0 ? `: ${product.stockCount} ${product.unit}` : ''}`
            : 'Поставка под заказ'}
        </div>
        <div className="mt-1 text-ink-4">Срок подтвердим в КП</div>
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
          highlightOnCardHover
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
