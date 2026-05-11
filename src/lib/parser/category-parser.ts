import * as cheerio from 'cheerio'

export interface ParsedCategory {
  name: string
  slug: string
  url: string
  productCount: number
  parentSlug?: string
  imageUrl?: string
}

/**
 * Parse level 1 categories from ChipDip catalog page (catalog__g1 blocks)
 * These are main categories like "Микросхемы", "Резисторы", "Конденсаторы"
 */
export function parseLevel1Categories(html: string, parentSlug?: string): ParsedCategory[] {
  const $ = cheerio.load(html)
  const categories: ParsedCategory[] = []

  // ChipDip uses .catalog__g1 blocks for level 1 categories
  $('.catalog__g1').each((_, element) => {
    const $header = $(element).find('.catalog__header')
    const $link = $header.find('a.link')
    const $count = $header.find('sub.count')
    const $image = $header.find('img.g_image')

    if ($link.length > 0) {
      const url = $link.attr('href')
      const name = $link.text().trim()
      const countText = $count.text().trim()
      const productCount = countText ? parseInt(countText.replace(/\s/g, ''), 10) : 0
      const imageUrl = $image.attr('src')

      if (url && name) {
        // Extract slug from URL: /catalog/mikroshemy-1731 -> mikroshemy-1731
        const slug = url.replace('/catalog/', '')

        categories.push({
          name,
          slug,
          url: `https://www.chipdip.ru${url}`,
          productCount,
          parentSlug,
          imageUrl,
        })
      }
    }
  })

  return categories
}

/**
 * Parse level 2 categories from ChipDip catalog page (catalog__g2 blocks)
 * These are subcategories like "Микроконтроллеры", "Стабилизаторы напряжения"
 */
export function parseLevel2Categories(html: string, parentSlug?: string): ParsedCategory[] {
  const $ = cheerio.load(html)
  const categories: ParsedCategory[] = []

  // ChipDip uses .catalog__g2 blocks for level 2 subcategories
  $('.catalog__g2').each((_, element) => {
    const $row = $(element).find('.catalog__g2_row')
    const $link = $row.find('a.link')
    const $count = $row.find('sub.count')

    if ($link.length > 0) {
      const url = $link.attr('href')
      const name = $link.text().trim()
      const countText = $count.text().trim()
      const productCount = countText ? parseInt(countText.replace(/\s/g, ''), 10) : 0

      if (url && name) {
        // Extract slug from URL: /catalog/mikroshemy-1731 -> mikroshemy-1731
        const slug = url.replace('/catalog/', '')

        categories.push({
          name,
          slug,
          url: `https://www.chipdip.ru${url}`,
          productCount,
          parentSlug,
        })
      }
    }
  })

  return categories
}

/**
 * Extract main category info from page
 */
export function extractMainCategoryInfo(html: string): { name: string; slug: string; productCount: number } | null {
  const $ = cheerio.load(html)
  
  const name = $('h1[data-id]').first().text().trim()
  const slug = $('h1[data-id]').first().attr('data-id')
  const countText = $('h1[data-id]').parent().find('sub.count').first().text().trim()
  const productCount = countText ? parseInt(countText.replace(/\s/g, ''), 10) : 0

  if (name && slug) {
    return {
      name,
      slug: `category-${slug}`, // Add prefix to avoid conflicts with product slugs
      productCount,
    }
  }

  return null
}
