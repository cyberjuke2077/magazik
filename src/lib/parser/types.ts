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
  description: string | null
  weight: number | null
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
