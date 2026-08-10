import { Suspense } from 'react'
import { type Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Download, PackageSearch } from 'lucide-react'
import { getProductsPaginated } from '@/lib/queries/products'
import {
  getCategoriesWithCounts,
  getCategoryBySlug,
  getManufacturersWithCounts,
} from '@/lib/queries/categories'
import { parseCatalogParams } from '@/lib/catalog-utils'
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
import { CatalogGuideStrip } from './components/catalog-guide-strip'
import { CatalogQuickFilters } from './components/catalog-quick-filters'

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
          `${cat.name}: ${cat.count.toLocaleString('ru-RU')} позиций в каталоге. Добавьте нужные компоненты в заявку на коммерческое предложение.`,
        alternates: { canonical },
      }
    }
  }

  return {
    title: 'Каталог электронных компонентов',
    description:
      'Каталог электронных компонентов: резисторы, конденсаторы, микросхемы, транзисторы и датчики. Поиск по MPN и заявка на коммерческое предложение.',
    alternates: { canonical },
  }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams

  const query = Array.isArray(params.q) ? params.q[0] : params.q || null
  const categorySlug = Array.isArray(params.category) ? params.category[0] : params.category || null
  const manufacturerSlug = Array.isArray(params.manufacturer) ? params.manufacturer[0] : params.manufacturer || null

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
      <StickyNav />

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
            <h1 className="text-[30px] font-bold tracking-[-0.035em] text-ink">
              {activeCategoryName || 'Каталог'}
            </h1>
            <span className="text-sm text-ink-4">
              {result.total.toLocaleString('ru-RU')} позиций
            </span>
          </div>

          <div className="mt-4 flex gap-4">
            {/* Sidebar */}
            <aside className="sticky top-[112px] hidden h-fit w-[280px] shrink-0 overflow-hidden rounded-2xl bg-white p-4 shadow-[var(--shadow-xs)] lg:block">
              <div className="mb-4 rounded-xl bg-[#eef9f2] p-3">
                <div className="text-[10px] font-semibold text-stock">Инженерная поддержка</div>
                <div className="mt-1 text-sm font-bold text-ink">Нужен совместимый аналог?</div>
                <p className="mt-1 text-[11px] leading-[1.4] text-ink-3">
                  Пришлите MPN и требования. Проверим замену и сроки поставки.
                </p>
                <Link
                  href="/request-quote"
                  className="mt-3 inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-bold text-ink shadow-[var(--shadow-button)] transition-colors hover:bg-azure hover:text-white"
                >
                  Подобрать компонент
                </Link>
              </div>
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
              <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-xs)]">
                <CatalogQuickFilters categories={categories} activeSlug={parsed.categorySlug} />

                {/* Toolbar */}
                <div className="flex min-h-14 flex-wrap items-center gap-2 border-t border-[var(--border)] p-2.5">
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
                      className="flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border)] px-3 text-sm text-ink-3 transition-colors hover:border-azure/40 hover:text-ink"
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
                <div className="space-y-3" data-catalog-product-list>
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
                    {result.items.map((product, index) => (
                      <ProductRow
                        key={product.id}
                        priority={index === 0}
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
