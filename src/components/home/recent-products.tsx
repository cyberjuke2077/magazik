import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { ProductCard } from '@/components/catalog/product-card'
import { getRecentlyEnrichedProducts } from '@/lib/queries/products'

export async function RecentProducts() {
  const products = await getRecentlyEnrichedProducts(8)

  if (products.length === 0) return null

  return (
    <section className="bg-[#fafafa] py-7 sm:py-9" aria-labelledby="recent-products-title">
      <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2
              id="recent-products-title"
              className="text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl"
            >
              Новые товары
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-3">
              Свежие карточки с описаниями, характеристиками и документацией.
            </p>
          </div>

          <Link
            href="/catalog"
            className="group hidden items-center gap-2 text-sm font-bold text-azure transition-colors hover:text-azure-hover sm:flex"
          >
            Весь каталог
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="no-scrollbar grid auto-cols-[260px] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[280px] lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index === 0} variant="home" />
          ))}
        </div>

        <div className="mt-5 sm:hidden">
          <Link href="/catalog" className="ui-btn ui-btn-secondary w-full">Весь каталог</Link>
        </div>
      </div>
    </section>
  )
}
