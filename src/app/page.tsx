import { connection } from 'next/server'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { OrganizationJsonLd } from '@/components/seo/product-jsonld'
import { RecentlyViewed } from '@/components/catalog/recently-viewed'
import { HeroSlider } from '@/components/home/hero-slider'
import { CategoriesGrid } from '@/components/home/categories-grid'
import { Manufacturers } from '@/components/home/manufacturers'
import { RecentProducts } from '@/components/home/recent-products'
import { getCatalogSections } from '@/lib/queries/categories'
import styles from './home-page.module.css'

export default async function HomePage() {
  await connection()
  const sections = await getCatalogSections()

  return (
    <div className={`${styles.page} flex min-h-screen flex-col bg-white`}>
      <OrganizationJsonLd />
      <Header />
      <StickyNav />

      <main className="flex-1">
        <HeroSlider />
        <CategoriesGrid sections={sections} />
        <Manufacturers />
        <RecentProducts />
        <RecentlyViewed variant="home" />
      </main>

      <Footer />
    </div>
  )
}
