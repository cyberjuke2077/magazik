import { redirect } from 'next/navigation'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Старый маршрут категории. Каталог обслуживает разделы и подкатегории
 * через /catalog?category=<slug>, поэтому перенаправляем сюда.
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  redirect(`/catalog?category=${slug}`)
}
