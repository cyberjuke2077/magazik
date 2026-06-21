import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { OrganizationJsonLd } from '@/components/seo/product-jsonld'
import { HomeClient } from './home-client'
import { getProducts } from '@/lib/queries/products'
import { getCatalogSections, getCategoriesWithChildren, getTotalProductCount } from '@/lib/queries/categories'

export default async function HomePage() {
  // Fetch real products from PostgreSQL
  const allProducts = await getProducts()

  // Fetch categories for catalog menu + homepage section grid
  const [categories, sections, totalProducts] = await Promise.all([
    getCategoriesWithChildren(),
    getCatalogSections(),
    getTotalProductCount(),
  ])

  // Реальные товары в блоки: featured/priceWholesale в БД пусты, поэтому
  // показываем реальные позиции вместо пустых заглушек.
  const featured = allProducts.filter((p) => p.featured)
  const best = allProducts.filter((p) => p.priceWholesale)
  const featuredProducts = featured.length >= 4 ? featured : allProducts.slice(0, 4)
  // Для горизонтального rail нужно больше позиций (до 10)
  const popularProducts = allProducts.slice(4, 14).length >= 4 ? allProducts.slice(4, 14) : allProducts.slice(0, 8)
  const bestProducts = best.length >= 4 ? best : allProducts.slice(14, 18)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <OrganizationJsonLd />
      <Header />
      <StickyNav categories={categories} totalProducts={totalProducts} />
      <HomeClient
        featuredProducts={featuredProducts}
        popularProducts={popularProducts}
        bestProducts={bestProducts}
        sections={sections}
        totalProducts={totalProducts}
      />
      <Footer />
    </div>
  )
}
