import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ProductCard } from '@/components/catalog/product-card'
import { getRecentlyEnrichedProducts } from '@/lib/queries/products'
import { HorizontalShelf } from '@/components/ui/horizontal-shelf'

export async function RecentProducts() {
  const products = await getRecentlyEnrichedProducts(8)

  if (products.length === 0) return null

  return (
    <section className="bg-[#fafafa] py-6 sm:py-7" aria-labelledby="recent-products-title">
      <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2
              id="recent-products-title"
              className="text-xl font-bold tracking-[-0.02em] text-ink"
            >
              Новые товары
            </h2>
          </div>

          <Link
            href="/catalog"
            className="group flex shrink-0 items-center gap-2 text-xs font-semibold text-azure transition-colors hover:text-azure-hover sm:text-sm"
          >
            Весь каталог
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <HorizontalShelf label="Новые товары" className={`grid auto-cols-[260px] grid-flow-col gap-4 pb-2 pt-1 sm:auto-cols-[280px] ${products.length < 4 ? 'lg:auto-cols-[calc((100%-32px)/3)]' : 'lg:auto-cols-[calc((100%-48px)/4)]'}`}>
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index === 0} variant="home" />
          ))}
        </HorizontalShelf>
      </div>
    </section>
  )
}
