import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import { ProductCard } from '@/components/catalog/product-card'
import { getRecentlyEnrichedProducts } from '@/lib/queries/products'

export async function RecentProducts() {
  const products = await getRecentlyEnrichedProducts(8)

  if (products.length === 0) return null

  return (
    <section className="bg-canvas py-12 sm:py-16" aria-labelledby="recent-products-title">
      <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-azure">
              <Sparkles size={14} aria-hidden="true" />
              Каталог обновлен
            </div>
            <h2
              id="recent-products-title"
              className="text-2xl font-bold tracking-[-0.035em] text-ink sm:text-3xl"
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <Link
          href="/catalog"
          className="ui-btn ui-btn-secondary mt-6 w-full sm:hidden"
        >
          Весь каталог
        </Link>
      </div>
    </section>
  )
}
