import { getCategoriesWithChildren, getTotalProductCount } from '@/lib/queries/categories'
import { getProducts } from '@/lib/queries/products'
import { CatalogClient } from './catalog-client'

export default async function CatalogPage() {
  const categories = await getCategoriesWithChildren()
  const products = await getProducts()
  const totalProducts = await getTotalProductCount()

  return <CatalogClient categories={categories} products={products} totalProducts={totalProducts} />
}
