import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { HomeClient } from './home-client'
import { getProducts } from '@/lib/queries/products'
import { getCategoriesWithChildren, getTotalProductCount } from '@/lib/queries/categories'

export default async function HomePage() {
  // Fetch real products from PostgreSQL
  const allProducts = await getProducts()
  
  // Fetch categories for catalog menu
  const categories = await getCategoriesWithChildren()
  const totalProducts = await getTotalProductCount()
  
  // Split products into categories for different sections
  const featuredProducts = allProducts.filter(p => p.featured)
  const popularProducts = allProducts.filter(p => !p.featured)
  const bestProducts = allProducts.filter(p => p.priceWholesale)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav categories={categories} totalProducts={totalProducts} />
      <HomeClient 
        featuredProducts={featuredProducts}
        popularProducts={popularProducts}
        bestProducts={bestProducts}
      />
      <Footer />
    </div>
  )
}
