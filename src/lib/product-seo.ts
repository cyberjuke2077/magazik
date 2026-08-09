interface ProductSeoInput {
  name: string
  partNumber: string
  manufacturer: string
  description?: string | null
}

/** Публичное SEO-описание без неподтверждённого статуса наличия. */
export function getProductMetaDescription(product: ProductSeoInput): string {
  const description = product.description?.trim()
  if (description) return description

  return `${product.name} от ${product.manufacturer}. Артикул: ${product.partNumber}. Цена и условия поставки подтверждаются в коммерческом предложении.`
}
