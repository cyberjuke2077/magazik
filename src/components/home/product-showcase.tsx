import { ProductCard } from '@/components/catalog/product-card'
import { SectionHeader } from './section-header'
import { Reveal } from './reveal'
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
    <section className={`section-pad ${muted ? 'bg-[#f8fafc]' : 'bg-white'}`}>
      <div className="mx-auto max-w-[1400px] px-4">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          href={href}
          linkLabel={linkLabel}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.slice(0, 5).map((product, i) => (
            <Reveal key={product.id} delay={(i % 5) * 60} className="h-full">
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
