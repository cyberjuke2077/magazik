import { getCategoriesWithChildren, getTotalProductCount } from '@/lib/queries/categories'
import { getProducts } from '@/lib/queries/products'
import { notFound } from 'next/navigation'
import { CategoryPageClient } from './category-client'
import { type Metadata } from 'next'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const allCategories = await getCategoriesWithChildren()
  
  // Find the category by slug
  let categoryName = ''
  let categoryDescription: string | null = null
  
  for (const cat of allCategories) {
    if (cat.slug === slug) {
      categoryName = cat.name
      categoryDescription = cat.description
      break
    }
    const child = cat.children.find(c => c.slug === slug)
    if (child) {
      categoryName = child.name
      categoryDescription = null
      break
    }
  }
  
  if (!categoryName) {
    return {
      title: 'Категория не найдена',
    }
  }
  
  return {
    title: categoryName,
    description: categoryDescription || `Каталог товаров в категории ${categoryName}. Широкий выбор электронных компонентов с доставкой.`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  
  // Load all data in parallel
  const [allCategories, allProducts, totalProducts] = await Promise.all([
    getCategoriesWithChildren(),
    getProducts(),
    getTotalProductCount(),
  ])
  
  // Find the category by slug (could be level 1 or level 2)
  let category = null
  let parentCategory = null
  
  for (const cat of allCategories) {
    if (cat.slug === slug) {
      category = cat
      break
    }
    const child = cat.children.find(c => c.slug === slug)
    if (child) {
      category = child
      parentCategory = cat
      break
    }
  }
  
  if (!category) {
    notFound()
  }
  
  // Filter products for this category
  const categoryProducts = allProducts.filter(p => p.categorySlug === slug)
  
  return (
    <CategoryPageClient
      category={category}
      parentCategory={parentCategory}
      allCategories={allCategories}
      products={categoryProducts}
      totalProducts={totalProducts}
    />
  )
}
