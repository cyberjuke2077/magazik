import { PACKAGE_FAMILIES, type PackageFamily } from '../constants/package-families'
import { extractPackageFamily } from './package-extractor'

/** Общий placeholder для товаров без фото и без распознанного корпуса. */
export const GENERIC_PLACEHOLDER = '/placeholder-product.svg'

/** Набор семейств, для которых реально существует SVG в public/packages/. */
const AVAILABLE = new Set<string>(PACKAGE_FAMILIES)

/**
 * Публичный путь к generic-SVG корпуса.
 * Возвращает GENERIC_PLACEHOLDER, если SVG для семейства нет.
 */
export function packageFamilyImageUrl(family: PackageFamily | null): string {
  if (family && AVAILABLE.has(family)) return `/packages/${family}.svg`
  return GENERIC_PLACEHOLDER
}

/**
 * Главный хелпер выбора картинки-заглушки для товара без реального фото.
 * Извлекает семейство корпуса из package/partNumber/name и отдаёт
 * соответствующий generic-SVG, либо общий placeholder.
 *
 * Используется фронтендом (карточка/страница товара) и бэкфилл-скриптом.
 *
 * @example
 * fallbackImageForProduct({ package: 'SOIC-8', partNumber: 'LM358DR' })
 *   // → '/packages/soic.svg'
 * fallbackImageForProduct({ package: null, partNumber: 'СП3-19А' })
 *   // → '/placeholder-product.svg'
 */
export function fallbackImageForProduct(input: {
  package?: string | null
  partNumber: string
  name?: string | null
}): string {
  const family = extractPackageFamily(input.package, input.partNumber, input.name)
  return packageFamilyImageUrl(family)
}

/**
 * Путь к generic-SVG корпуса для товара, либо null если корпус не
 * распознан. В отличие от {@link fallbackImageForProduct} НЕ подставляет
 * общий placeholder — null позволяет вызывающему коду решить, что
 * показать дальше (например иконку категории).
 *
 * @example
 * packageSvgForProduct({ partNumber: 'LM358DR' })   // → '/packages/soic.svg'
 * packageSvgForProduct({ partNumber: 'СП3-19А' })    // → null
 */
export function packageSvgForProduct(input: {
  package?: string | null
  partNumber: string
  name?: string | null
}): string | null {
  const family = extractPackageFamily(input.package, input.partNumber, input.name)
  if (family && AVAILABLE.has(family)) return `/packages/${family}.svg`
  return null
}
