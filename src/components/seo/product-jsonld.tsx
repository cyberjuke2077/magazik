import type { Product } from '@/lib/queries/products'
import { COMPANY } from '@/lib/company'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://electromagaz.ru'

interface ProductJsonLdProps {
  product: Product
}

/**
 * Schema.org Product structured data (JSON-LD) for SEO.
 * Renders an inline <script> with serialized JSON.
 */
export function ProductJsonLd({ product }: ProductJsonLdProps) {
  const url = `${SITE_URL}/product/${product.slug}`

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    sku: product.partNumber,
    mpn: product.partNumber,
    url,
    brand: {
      '@type': 'Brand',
      name: product.manufacturer,
    },
    category: product.category,
  }

  if (product.description) {
    data.description = product.description
  }

  if (product.images && product.images.length > 0) {
    data.image = product.images
  }

  if (product.price > 0) {
    data.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: product.currency || 'RUB',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      seller: {
        '@type': 'Organization',
        name: 'Electromagaz',
      },
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

interface OrganizationJsonLdProps {
  url?: string
}

export function OrganizationJsonLd({ url }: OrganizationJsonLdProps = {}) {
  const data = {
    '@context': 'https://schema.org/',
    '@type': 'Organization',
    name: COMPANY.shortName,
    url: url || SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: COMPANY.phone.raw,
      contactType: 'sales',
      areaServed: 'RU',
      availableLanguage: 'ru',
    },
    sameAs: [],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
