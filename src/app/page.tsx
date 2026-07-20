import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { OrganizationJsonLd } from '@/components/seo/product-jsonld'
import { RecentlyViewed } from '@/components/catalog/recently-viewed'
import { HeroSlider } from '@/components/home/hero-slider'
import { TrustBadges } from '@/components/home/trust-badges'
import { CategoriesGrid } from '@/components/home/categories-grid'
import { Manufacturers } from '@/components/home/manufacturers'
import { ProductShowcase } from '@/components/home/product-showcase'
import { B2bCta } from '@/components/home/b2b-cta'
import { getProducts } from '@/lib/queries/products'
import { getCatalogSections, getCategoriesWithChildren, getTotalProductCount } from '@/lib/queries/categories'

export default async function HomePage() {
  const allProducts = await getProducts()

  const [categories, sections, totalProducts] = await Promise.all([
    getCategoriesWithChildren(),
    getCatalogSections(),
    getTotalProductCount(),
  ])

  // featured/priceWholesale в БД часто пусты — показываем реальные позиции.
  const featured = allProducts.filter((p) => p.featured)
  const bestSellers = (featured.length >= 5 ? featured : allProducts).slice(0, 5)
  const newArrivals = allProducts.slice(5, 10).length >= 4 ? allProducts.slice(5, 10) : allProducts.slice(0, 5)

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <OrganizationJsonLd />
      <Header />
      <StickyNav categories={categories} totalProducts={totalProducts} />

      <main className="flex-1">
        <HeroSlider totalProducts={totalProducts} />
        <TrustBadges totalProducts={totalProducts} sectionsCount={sections.length} />
        <CategoriesGrid sections={sections} />
        <Manufacturers />
        <ProductShowcase
          title="Недавно добавили"
          href="/catalog?sort=new"
          products={newArrivals}
        />
        <ProductShowcase
          title="Чаще всего заказывают"
          href="/catalog"
          products={bestSellers}
        />
        <RecentlyViewed variant="home" />
        <B2bCta />
      </main>

      <Footer />
    </div>
  )
}
