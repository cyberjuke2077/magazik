/**
 * Parser Types
 * 
 * Type definitions for ChipDip product parser.
 * Represents structured data extracted from product pages.
 */

export interface ParsedProduct {
  name: string
  partNumber: string | null
  sku: string | null
  manufacturer: string | null
  category: string | null
  /** Полный путь категории из хлебных крошек (от общего к частному, без «Главная» и товара) */
  categoryPath: string[]
  description: string | null
  weight: number | null
  /** Current single-unit price from the source, when publicly available */
  price: number | null
  /** ISO 4217 currency for price */
  currency: string | null
  specifications: Record<string, string>
  images: string[]
  datasheets: string[]
  analogs: string[]
}

export interface ParseResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SpecificationRow {
  key: string
  value: string
}
