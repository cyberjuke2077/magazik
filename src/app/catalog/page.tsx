import { Suspense } from 'react'
import { type Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Download, PackageSearch } from 'lucide-react'
import { getProductsPaginated } from '@/lib/queries/products'
import {
  getCatalogSections,
  getCategoriesWithChildren,
  getCategoriesWithCounts,
  getCategoryBySlug,
  getManufacturersWithCounts,
} from '@/lib/queries/categories'
import { parseCatalogParams } from '@/lib/catalog-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { CategoryTree } from './components/category-tree'
import { ManufacturerFilter } from './components/manufacturer-filter'
import { ProductRow } from './components/product-row'
import { ProductTable } from './components/product-table'
import { Pagination } from './components/pagination'
import { SortSelect } from './components/sort-select'
import { ViewToggle } from './components/view-toggle'
import { ActiveFilters } from './components/active-filters'
import { CopyLinkBtn } from './components/copy-link-btn'
import { BulkSelectWrapper } from './components/bulk-select-panel'
import { MobileFilterDrawer } from './components/mobile-filter-drawer'
import { CatalogStats } from './components/catalog-stats'
import { CatalogShowcase } from './components/catalog-showcase'
import { CatalogGuideStrip } from './components/catalog-guide-strip'

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(v: string | string[] | undefined): string | null {
  return Array.isArray(v) ? v[0] : v || null
}

export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const params = await searchParams
  const query = firstParam(params.q)
  const categorySlug = firstParam(params.category)
  const manufacturerSlug = firstParam(params.manufacturer)

  // Канонический URL держит только осмысленные фильтры; sort/view/limit/page
  // схлопываются — это один и тот же контент в другом порядке, дубли для робота.
  const canonicalParams = new URLSearchParams()
  if (categorySlug) canonicalParams.set('category', categorySlug)
  if (manufacturerSlug) canonicalParams.set('manufacturer', manufacturerSlug)
  const cq = canonicalParams.toString()
  const canonical = cq ? `/catalog?${cq}` : '/catalog'

  // Поисковую выдачу в индекс не пускаем: бесконечные запросы = мусорные страницы.
  if (query) {
    return {
      title: `Поиск: ${query}`,
      robots: { index: false, follow: true },
      alternates: { canonical: '/catalog' },
    }
  }

  if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug)
    if (cat) {
      return {
        title: `${cat.name} — купить оптом и в розницу`,
        description:
          cat.description ||
          `${cat.name}: ${cat.count.toLocaleString('ru-RU')} позиций в наличии и под заказ. Отправка в день заказа, доставка по России. Купить в Electromagaz.`,
        alternates: { canonical },
      }
    }
  }

  return {
    title: 'Каталог электронных компонентов',
    description:
      'Полный каталог электронных компонентов: резисторы, конденсаторы, микросхемы, транзисторы, датчики. Оптом и в розницу, отправка в день заказа.',
    alternates: { canonical },
  }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams

  const query = Array.isArray(params.q) ? params.q[0] : params.q || null
  const categorySlug = Array.isArray(params.category) ? params.category[0] : params.category || null
  const manufacturerSlug = Array.isArray(params.manufacturer) ? params.manufacturer[0] : params.manufacturer || null

  // Витрина разделов показывается, когда не выбран ни один фильтр.
  const showShowcase = !query && !categorySlug && !manufacturerSlug

  const [navCategories, totalManufacturers, totalCategories, totalProductsAll] = await Promise.all([
    getCategoriesWithChildren(),
    prisma.manufacturer.count(),
    prisma.category.count({ where: { parentId: { not: null } } }),
    prisma.product.count(),
  ])

  if (showShowcase) {
    const sections = await getCatalogSections()

    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <Header />
        <StickyNav categories={navCategories} totalProducts={totalProductsAll} />

        <div className="bg-canvas">
          <div className="mx-auto max-w-[1440px] px-3 py-2 sm:px-6">
            <nav className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-xs text-ink-3">
              <Link href="/" className="hover:text-azure transition-colors">Главная</Link>
              <ChevronRight size={12} className="text-ink-4" />
              <span className="text-ink-2">Каталог</span>
            </nav>
          </div>
        </div>

        <main className="flex-1">
          <div className="mx-auto max-w-[1440px] px-3 pb-8 pt-3 sm:px-6">
            <div className="mb-1 flex items-baseline gap-3">
              <h1 className="text-[28px] font-bold tracking-tight text-ink">Каталог</h1>
              <span className="text-sm text-ink-4">
                {totalProductsAll.toLocaleString('ru-RU')} позиций
              </span>
            </div>

            <CatalogStats
              totalProducts={totalProductsAll}
              totalManufacturers={totalManufacturers}
              totalCategories={totalCategories}
            />

            <div className="mt-4">
              <CatalogShowcase sections={sections} />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // First pass: get total count to properly parse params
  const prelimResult = await getProductsPaginated({
    page: 1,
    limit: 1,
    query,
    categorySlug,
    manufacturerSlug,
  })

  const parsed = parseCatalogParams(params, prelimResult.total)

  const [result, categories, manufacturers] = await Promise.all([
    getProductsPaginated({
      page: parsed.page,
      limit: parsed.limit,
      query: parsed.query,
      categorySlug: parsed.categorySlug,
      manufacturerSlug: parsed.manufacturerSlug,
      sort: parsed.sort,
    }),
    getCategoriesWithCounts(),
    getManufacturersWithCounts(parsed.categorySlug, parsed.query),
  ])

  // Get active category name for breadcrumbs
  let activeCategoryName: string | null = null
  if (parsed.categorySlug) {
    const cat = await getCategoryBySlug(parsed.categorySlug)
    if (cat) activeCategoryName = cat.name
  }

  // Get active manufacturer name for filter tag
  let activeManufacturerName: string | null = null
  if (parsed.manufacturerSlug) {
    const mfr = manufacturers.find((m) => m.slug === parsed.manufacturerSlug)
    if (mfr) activeManufacturerName = mfr.name
  }

  // Build base params for pagination links (without page)
  const baseSearchParams = new URLSearchParams()
  if (parsed.query) baseSearchParams.set('q', parsed.query)
  if (parsed.categorySlug) baseSearchParams.set('category', parsed.categorySlug)
  if (parsed.manufacturerSlug) baseSearchParams.set('manufacturer', parsed.manufacturerSlug)
  if (parsed.sort !== 'date') baseSearchParams.set('sort', parsed.sort)
  if (parsed.limit !== 50) baseSearchParams.set('limit', String(parsed.limit))
  if (parsed.view !== 'list') baseSearchParams.set('view', parsed.view)
  const baseParams = baseSearchParams.toString()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav categories={navCategories} totalProducts={totalProductsAll} />

      {/* Breadcrumbs */}
      <div className="bg-canvas">
        <div className="mx-auto max-w-[1380px] px-4 pb-2 pt-[29px] lg:px-0">
          <nav className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-xs text-ink-3">
            <Link href="/" className="hover:text-azure transition-colors">
              Главная
            </Link>
            <ChevronRight size={12} className="text-ink-4" />
            {activeCategoryName ? (
              <>
                <Link href="/catalog" className="hover:text-azure transition-colors">
                  Каталог
                </Link>
                <ChevronRight size={12} className="text-ink-4" />
                <span className="text-ink font-medium">{activeCategoryName}</span>
              </>
            ) : (
              <span className="text-ink-2">Каталог</span>
            )}
          </nav>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-[1380px] px-4 pb-8 pt-3 lg:px-0">
          {/* Page title */}
          <div className="mb-1 flex items-baseline gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-ink">
              {activeCategoryName || 'Каталог'}
            </h1>
            <span className="text-sm text-ink-4">
              {result.total.toLocaleString('ru-RU')} позиций
            </span>
          </div>

          <div className="mt-4 flex gap-4">
            {/* Sidebar */}
            <aside className="sticky top-[112px] hidden h-fit w-[280px] shrink-0 rounded-xl border border-[var(--border)] bg-white p-4 lg:block">
              <Suspense fallback={<div className="h-40 skeleton rounded" />}>
                <CategoryTree
                  categories={categories}
                  activeSlug={parsed.categorySlug}
                />
              </Suspense>
              <ManufacturerFilter
                manufacturers={manufacturers}
                activeSlug={parsed.manufacturerSlug}
              />
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="mb-3 flex min-h-12 flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-white p-2">
                {parsed.query && (
                  <span className="mr-auto min-w-0 truncate text-sm text-ink-3">
                    Результаты для «<span className="font-medium text-ink-2">{parsed.query}</span>»
                  </span>
                )}
                <div className={`${parsed.query ? '' : 'ml-auto'} flex flex-wrap items-center gap-2`}>
                  <MobileFilterDrawer>
                    <CategoryTree
                      categories={categories}
                      activeSlug={parsed.categorySlug}
                    />
                    <ManufacturerFilter
                      manufacturers={manufacturers}
                      activeSlug={parsed.manufacturerSlug}
                    />
                  </MobileFilterDrawer>
                  <CopyLinkBtn />
                  <a
                    href={`/api/catalog/export${baseParams ? `?${baseParams}` : ''}`}
                    className="flex items-center gap-1.5 h-8 px-3 text-sm text-ink-3 border border-[var(--border)] rounded-[var(--radius-control)] hover:border-azure/40 hover:text-ink transition-colors"
                    title="Экспорт CSV"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">CSV</span>
                  </a>
                  <Suspense fallback={null}>
                    <ViewToggle />
                  </Suspense>
                  <Suspense fallback={null}>
                    <SortSelect />
                  </Suspense>
                </div>
              </div>

              {/* Active filters */}
              <ActiveFilters
                categoryName={activeCategoryName}
                categorySlug={parsed.categorySlug}
                manufacturerName={activeManufacturerName}
                manufacturerSlug={parsed.manufacturerSlug}
                query={parsed.query}
                sort={parsed.sort}
              />

              {parsed.categorySlug && <CatalogGuideStrip />}

              {/* Product list */}
              {result.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--border)] bg-white py-20 text-center">
                  <PackageSearch size={42} strokeWidth={1.4} className="mb-4 text-ink-4" />
                  <h3 className="text-lg font-bold text-ink mb-2">Ничего не найдено</h3>
                  <p className="text-sm text-ink-3 mb-5">
                    Попробуйте изменить фильтры или поисковый запрос
                  </p>
                  <Link href="/catalog" className="ui-btn ui-btn-primary ui-btn-sm">
                    Сбросить фильтры
                  </Link>
                </div>
              ) : parsed.view === 'table' ? (
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
                  <BulkSelectWrapper
                    products={result.items.map((p) => ({
                      id: p.id,
                      partNumber: p.partNumber,
                      name: p.name,
                      manufacturer: p.manufacturer,
                      minOrder: p.minOrder,
                      price: p.price || null,
                    }))}
                  >
                    <ProductTable
                      products={result.items.map((product) => ({
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        partNumber: product.partNumber,
                        manufacturer: product.manufacturer,
                        price: product.price,
                        minOrder: product.minOrder,
                        package: product.package,
                        lifecycle: product.lifecycle,
                        lastEnrichedAt: product.lastEnrichedAt,
                      }))}
                    />
                  </BulkSelectWrapper>
                </div>
              ) : (
                <div className="space-y-2">
                  <BulkSelectWrapper
                    products={result.items.map((p) => ({
                      id: p.id,
                      partNumber: p.partNumber,
                      name: p.name,
                      manufacturer: p.manufacturer,
                      minOrder: p.minOrder,
                      price: p.price || null,
                    }))}
                  >
                    {result.items.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={{
                          id: product.id,
                          slug: product.slug,
                          name: product.name,
                          partNumber: product.partNumber,
                          manufacturer: product.manufacturer,
                          categorySlug: product.categorySlug,
                          price: product.price,
                          minOrder: product.minOrder,
                          package: product.package,
                          lifecycle: product.lifecycle,
                          description: product.description,
                          lastEnrichedAt: product.lastEnrichedAt,
                          datasheets: product.datasheets,
                          images: product.images,
                          specs: product.specs,
                          inStock: product.inStock,
                          stockCount: product.stockCount,
                          unit: product.unit,
                        }}
                      />
                    ))}
                  </BulkSelectWrapper>
                </div>
              )}

              {/* Pagination */}
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
                limit={result.limit}
                baseParams={baseParams}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
