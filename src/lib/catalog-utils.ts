export type SortOption = 'name' | 'partNumber' | 'date' | 'manufacturer'
export type ViewMode = 'list' | 'table'

export interface ParsedCatalogParams {
  page: number
  limit: number
  query: string | null
  categorySlug: string | null
  manufacturerSlug: string | null
  sort: SortOption
  view: ViewMode
}

const VALID_SORTS: SortOption[] = ['name', 'partNumber', 'date', 'manufacturer']
const VALID_VIEWS: ViewMode[] = ['list', 'table']

export function parseCatalogParams(
  searchParams: Record<string, string | string[] | undefined>,
  totalItems: number,
): ParsedCatalogParams {
  const rawPage = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page
  const rawLimit = Array.isArray(searchParams.limit)
    ? searchParams.limit[0]
    : searchParams.limit
  const rawQuery = Array.isArray(searchParams.q)
    ? searchParams.q[0]
    : searchParams.q
  const rawCategory = Array.isArray(searchParams.category)
    ? searchParams.category[0]
    : searchParams.category
  const rawManufacturer = Array.isArray(searchParams.manufacturer)
    ? searchParams.manufacturer[0]
    : searchParams.manufacturer
  const rawSort = Array.isArray(searchParams.sort)
    ? searchParams.sort[0]
    : searchParams.sort
  const rawView = Array.isArray(searchParams.view)
    ? searchParams.view[0]
    : searchParams.view

  // Parse limit first (needed for totalPages calculation)
  let limit = parseInt(rawLimit || '', 10)
  if (isNaN(limit) || limit < 1) limit = 50
  if (limit > 100) limit = 100

  // Calculate totalPages
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))

  // Parse page with clamping
  let page = parseInt(rawPage || '', 10)
  if (isNaN(page) || page < 1) page = 1
  if (page > totalPages) page = totalPages

  // Parse query
  const trimmedQuery = rawQuery?.trim() || null
  const query = trimmedQuery || null

  // Parse category slug
  const categorySlug = rawCategory?.trim() || null

  // Parse manufacturer slug
  const manufacturerSlug = rawManufacturer?.trim() || null

  // Parse sort
  const sort: SortOption = VALID_SORTS.includes(rawSort as SortOption)
    ? (rawSort as SortOption)
    : 'date'

  // Parse view
  const view: ViewMode = VALID_VIEWS.includes(rawView as ViewMode)
    ? (rawView as ViewMode)
    : 'list'

  return {
    page,
    limit,
    query,
    categorySlug,
    manufacturerSlug,
    sort,
    view,
  }
}

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || price === 0) {
    return 'Цена по запросу'
  }

  const rounded = Math.round(price)
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} ₽`
}

export function isNewProduct(lastEnrichedAt: string | Date | null | undefined): boolean {
  if (!lastEnrichedAt) return false
  const enrichedDate = new Date(lastEnrichedAt)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return enrichedDate > sevenDaysAgo
}
