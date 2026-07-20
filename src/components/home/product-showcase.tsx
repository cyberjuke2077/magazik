import { ProductCard } from '@/components/catalog/product-card'
import { SectionHeader } from './section-header'
import { type Product } from '@/lib/queries/products'

interface ProductShowcaseProps {
  eyebrow?: string
  title: string
  description?: string
  href: string
  linkLabel?: string
  products: Product[]
  /** Светло-серый фон для чередования секций */
  muted?: boolean
}

export function ProductShowcase({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'Смотреть все',
  products,
  muted = false,
}: ProductShowcaseProps) {
  if (products.length === 0) return null
  return (
    <section className={`py-5 ${muted ? 'bg-surface-muted' : 'bg-canvas'}`}>
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          href={href}
          linkLabel={linkLabel}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {products.slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
