import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { getFeaturedProducts } from '@/lib/queries/products'

export default async function HitsPage() {
  const featuredProducts = await getFeaturedProducts()
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
              <span className="text-ink-2 font-medium">Хиты продаж</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6">
          <h1 className="mb-4 text-2xl font-bold text-ink">Хиты продаж</h1>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
