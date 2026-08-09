import { describe, expect, it } from 'vitest'
import { getProductMetaDescription } from './product-seo'

const product = {
  name: 'Микроконтроллер',
  partNumber: 'TEST-MPN',
  manufacturer: 'Test Manufacturer',
}

describe('product SEO description', () => {
  it('uses a supplied description unchanged', () => {
    expect(getProductMetaDescription({ ...product, description: '  Описание товара.  ' })).toBe(
      'Описание товара.',
    )
  })

  it('does not expose internal availability in the fallback', () => {
    const description = getProductMetaDescription(product)

    expect(description).toContain('условия поставки подтверждаются')
    expect(description).not.toMatch(/в наличии|под заказ/i)
  })
})
