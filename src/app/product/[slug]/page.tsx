import { getProductBySlug, getProductsByCategory } from '@/lib/queries/products'
import { ProductClientChipDip } from './product-client-chipdip'
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/product-jsonld'
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Товар не найден',
    }
  }

  return {
    title: `${product.name} (${product.partNumber})`,
    description: product.description || `${product.name} от ${product.manufacturer}. Артикул: ${product.partNumber}. ${product.inStock ? 'В наличии' : 'Под заказ'}.`,
    openGraph: {
      title: `${product.name} (${product.partNumber})`,
      description: product.description || `${product.name} от ${product.manufacturer}`,
      images: product.images.length > 0 ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  
  // Fetch product first, then related products in parallel
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const related = await getProductsByCategory(product.categorySlug)
  const relatedFiltered = related.filter(p => p.id !== product.id).slice(0, 4)

  const breadcrumbs = [
    { name: 'Главная', url: '/' },
    { name: 'Каталог', url: '/catalog' },
    { name: product.category, url: `/catalog?category=${product.categorySlug}` },
    { name: product.name, url: `/product/${product.slug}` },
  ]

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ProductClientChipDip product={product} related={relatedFiltered} />
    </>
  )
}
