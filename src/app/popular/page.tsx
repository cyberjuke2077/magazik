import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { getProducts } from '@/lib/queries/products'

export default async function PopularPage() {
  const products = await getProducts()
  const popularProducts = products.filter((p) => !p.featured).slice(0, 20)
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />
      <main>
        {/* Breadcrumb */}
        <div className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1440px] px-3 py-2 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
              <ChevronRight size={13} className="text-ink-4" />
              <span className="text-ink-2 font-medium">Набирают популярность</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] px-3 py-8 sm:px-6">
          <h1 className="mb-6 max-w-6xl text-3xl font-bold tracking-[-0.03em] text-ink">Набирают популярность</h1>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
