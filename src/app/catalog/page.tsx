import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronRight, Download } from 'lucide-react'
import { getProductsPaginated } from '@/lib/queries/products'
import { getCategoriesWithCounts, getCategoryBySlug, getManufacturersWithCounts } from '@/lib/queries/categories'
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
import { HoverPreview } from './components/hover-preview'
import { MobileFilterDrawer } from './components/mobile-filter-drawer'
import { CatalogStats } from './components/catalog-stats'

interface CatalogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams

  // First pass: get total count to properly parse params
  const prelimResult = await getProductsPaginated({
    page: 1,
    limit: 1,
    query: Array.isArray(params.q) ? params.q[0] : params.q || null,
    categorySlug: Array.isArray(params.category) ? params.category[0] : params.category || null,
    manufacturerSlug: Array.isArray(params.manufacturer) ? params.manufacturer[0] : params.manufacturer || null,
  })

  const parsed = parseCatalogParams(params, prelimResult.total)

  // Fetch paginated products, categories, manufacturers, and stats in parallel
  const [result, categories, manufacturers, totalManufacturers, totalCategories] = await Promise.all([
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
    prisma.manufacturer.count(),
    prisma.category.count(),
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
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      {/* Breadcrumbs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-2">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#0066cc] transition-colors">
              Главная
            </Link>
            <ChevronRight size={12} className="text-gray-300" />
            {activeCategoryName ? (
              <>
                <Link href="/catalog" className="hover:text-[#0066cc] transition-colors">
                  Каталог
                </Link>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="text-gray-900 font-medium">{activeCategoryName}</span>
              </>
            ) : (
              <span className="text-gray-700">Каталог</span>
            )}
          </nav>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-4">
          {/* Page title */}
          <div className="flex items-baseline gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeCategoryName || 'Каталог'}
            </h1>
            <span className="text-sm text-gray-400">
              {result.total.toLocaleString('ru-RU')} позиций
            </span>
          </div>

          {/* Stats */}
          <CatalogStats
            totalProducts={result.total}
            totalManufacturers={totalManufacturers}
            totalCategories={totalCategories}
          />

          {/* Mobile filter button */}
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

          <div className="flex gap-5 mt-4">
            {/* Sidebar */}
            <aside className="hidden lg:block w-[220px] shrink-0">
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
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                {parsed.query && (
                  <span className="text-sm text-gray-500">
                    Результаты для «<span className="font-medium text-gray-700">{parsed.query}</span>»
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <CopyLinkBtn />
                  <a
                    href={`/api/catalog/export${baseParams ? `?${baseParams}` : ''}`}
                    className="flex items-center gap-1.5 h-8 px-3 text-sm text-gray-600 border border-gray-200 rounded hover:border-gray-300 hover:text-gray-800 transition-colors"
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

              {/* Product list */}
              {result.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="text-5xl mb-4 opacity-20">◆</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Ничего не найдено</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Попробуйте изменить фильтры или поисковый запрос
                  </p>
                  <Link
                    href="/catalog"
                    className="h-9 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] transition-all inline-flex items-center"
                  >
                    Сбросить фильтры
                  </Link>
                </div>
              ) : parsed.view === 'table' ? (
                <div className="border border-gray-200 rounded overflow-hidden">
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
                <div className="border border-gray-200 rounded overflow-hidden">
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
                      <HoverPreview
                        key={product.id}
                        product={{
                          name: product.name,
                          description: product.description,
                          specs: product.specs,
                          datasheets: product.datasheets,
                          package: product.package,
                        }}
                      >
                        <ProductRow
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
                          }}
                        />
                      </HoverPreview>
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
