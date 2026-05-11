import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/catalog/product-card'
import { getProducts } from '@/lib/queries/products'

export default async function BestPage() {
  const products = await getProducts()
  const bestProducts = products.filter((p) => p.priceWholesale).slice(0, 20)
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      <main>
        {/* Breadcrumb */}
        <div className="border-b border-gray-100">
          <div className="mx-auto max-w-[1400px] px-4 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-gray-400">
              <Link href="/" className="hover:text-gray-600 transition-colors">Главная</Link>
              <ChevronRight size={13} className="text-gray-300" />
              <span className="text-gray-700 font-medium">Лучшие предложения</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Лучшие предложения</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {bestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
