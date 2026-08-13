import * as fs from 'node:fs'
import * as path from 'node:path'

import * as XLSX from 'xlsx'
import { parse as csvParse } from 'csv-parse/sync'

import type { SupplierRow } from '../types'
import { normalizeMpn } from './mpn-normalizer'
import { mapBrand } from './brand-mapper'

/**
 * Statistics collected during the import process.
 */
export interface ImportStats {
  /** Total number of files found in the input directory */
  totalFiles: number
  /** Files where Chinese headers were detected */
  filesWithHeaders: number
  /** Files where auto-detect determined no headers (data starts at row 1) */
  filesWithoutHeaders: number
  /** Files skipped because no MPN column could be identified */
  skippedFiles: number
  /** Total data rows processed (excluding header rows) */
  totalRows: number
  /** Rows skipped due to empty/null MPN */
  skippedRows: number
}

/** Supported file extensions for import */
const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv']

/**
 * Regex for MPN auto-detection: Latin letter followed by 2-29 more
 * alphanumeric/dash/plus/slash/dot characters (total 3-30 chars).
 */
const MPN_PATTERN = /^[A-Za-z][A-Za-z0-9\-+/.]{2,29}$/

/** Chinese character range — used to exclude non-MPN first cells */
const CHINESE_CHAR_PATTERN = /[\u4e00-\u9fff]/

/** Header aliases accepted in customer and supplier files. */
const HEADER_ALIASES = {
  mpn: [
    '型号',
    'mpn',
    'partnumber',
    'manufacturerpartnumber',
    'артикул',
    'партномер',
    'номердетали',
    'маркировка',
  ],
  brand: ['品牌', 'brand', 'manufacturer', 'бренд', 'производитель'],
  package: ['封装', 'package', 'case', 'корпус'],
  dateCode: ['批号', 'datecode', 'batch', 'партия', 'датапартии'],
} as const

type ColumnMapping = {
  mpn: number
  brand: number
  package?: number
  dateCode?: number
}

/**
 * Reads all supplier Excel/CSV files from the given directory,
 * detects headers or uses positional mapping, normalizes MPN and brand,
 * and returns all valid rows with import statistics.
 *
 * @param inputDir - Absolute path to the directory containing supplier files
 * @returns Object with parsed rows and import statistics
 *
 * @example
 * const { rows, stats } = importSupplierFiles('/path/to/supplier-files')
 * console.log(`Imported ${rows.length} rows from ${stats.totalFiles} files`)
 */
export function importSupplierFiles(inputDir: string): { rows: SupplierRow[]; stats: ImportStats } {
  const stats: ImportStats = {
    totalFiles: 0,
    filesWithHeaders: 0,
    filesWithoutHeaders: 0,
    skippedFiles: 0,
    totalRows: 0,
    skippedRows: 0,
  }

  const rows: SupplierRow[] = []

  // Read directory entries
  let entries: string[]
  try {
    entries = fs.readdirSync(inputDir)
  } catch (err) {
    console.error(`[ExcelImporter] Cannot read directory: ${inputDir}`, err)
    return { rows, stats }
  }

  // Filter to supported file extensions
  const files = entries.filter((name) => {
    const ext = path.extname(name).toLowerCase()
    return SUPPORTED_EXTENSIONS.includes(ext)
  })

  stats.totalFiles = files.length

  for (const fileName of files) {
    const filePath = path.join(inputDir, fileName)
    const ext = path.extname(fileName).toLowerCase()

    try {
      const fileRows = ext === '.csv'
        ? readCsvFile(filePath)
        : readExcelFile(filePath)

      if (fileRows.length === 0) {
        console.warn(`[ExcelImporter] Empty file, skipping: ${fileName}`)
        stats.skippedFiles++
        continue
      }

      const result = processFileRows(fileRows, filePath, stats)
      if (result === null) {
        // File was skipped (no MPN column detected)
        stats.skippedFiles++
        continue
      }

      rows.push(...result)
    } catch (err) {
      console.error(`[ExcelImporter] Error reading file: ${fileName}`, err)
      stats.skippedFiles++
    }
  }

  return { rows, stats }
}

/**
 * Reads an Excel file (.xlsx/.xls) and returns raw row data as string arrays.
 */
function readExcelFile(filePath: string): string[][] {
  const workbook = XLSX.readFile(filePath, { type: 'file' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []

  const data: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  return data
}

/**
 * Reads a CSV file and returns raw row data as string arrays.
 */
function readCsvFile(filePath: string): string[][] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const records: string[][] = csvParse(content, {
    skip_empty_lines: true,
    relax_column_count: true,
  })
  return records
}

/**
 * Processes raw file rows: detects headers or auto-detects positional mapping,
 * then extracts SupplierRow entries.
 *
 * @returns Array of SupplierRow or null if file should be skipped
 */
function processFileRows(
  rawRows: string[][],
  filePath: string,
  stats: ImportStats,
): SupplierRow[] | null {
  const fileName = path.basename(filePath)
  const firstRow = rawRows[0]

  if (!firstRow || firstRow.length === 0) {
    console.warn(`[ExcelImporter] No data in first row, skipping: ${fileName}`)
    return null
  }

  // Detect customer/supplier headers in the first row.
  const headerMapping = detectHeaders(firstRow)

  if (headerMapping) {
    // File has headers
    stats.filesWithHeaders++
    const dataRows = rawRows.slice(1)
    return extractRows(dataRows, headerMapping, filePath, stats)
  }

  // Try auto-detect: first cell matches MPN pattern (no Chinese chars)
  if (isAutoDetectMpn(firstRow[0])) {
    stats.filesWithoutHeaders++
    // Positional mapping: col1→MPN, col2→brand, col3→package
    const positionalMapping: ColumnMapping = {
      mpn: 0,
      brand: 1,
      package: firstRow.length > 2 ? 2 : undefined,
    }
    return extractRows(rawRows, positionalMapping, filePath, stats)
  }

  // Cannot identify MPN column
  console.warn(
    `[ExcelImporter] No MPN column detected (no Chinese headers, first cell does not match MPN pattern), skipping: ${fileName}`,
  )
  return null
}

/**
 * Detects supported header aliases in the first row.
 * Returns column mapping if headers are found, null otherwise.
 */
function detectHeaders(row: string[]): ColumnMapping | null {
  let mpnCol: number | undefined
  let brandCol: number | undefined
  let packageCol: number | undefined
  let dateCodeCol: number | undefined

  for (let i = 0; i < row.length; i++) {
    const cell = normalizeHeader(row[i] || '')
    if (!cell) continue

    if (hasAlias(HEADER_ALIASES.mpn, cell)) {
      mpnCol = i
    } else if (hasAlias(HEADER_ALIASES.brand, cell)) {
      brandCol = i
    } else if (hasAlias(HEADER_ALIASES.package, cell)) {
      packageCol = i
    } else if (hasAlias(HEADER_ALIASES.dateCode, cell)) {
      dateCodeCol = i
    }
  }

  // Must have at least MPN header to consider this a header row
  if (mpnCol === undefined) return null

  return {
    mpn: mpnCol,
    brand: brandCol ?? -1,
    package: packageCol,
    dateCode: dateCodeCol,
  }
}

function hasAlias(aliases: readonly string[], value: string): boolean {
  return aliases.includes(value)
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_./\\()-]+/g, '')
}

/**
 * Checks if a cell value matches the MPN auto-detect pattern:
 * Latin letters + digits, 3-30 chars, no Chinese characters.
 */
function isAutoDetectMpn(value: string | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false

  // Must not contain Chinese characters
  if (CHINESE_CHAR_PATTERN.test(trimmed)) return false

  // Must match MPN pattern
  return MPN_PATTERN.test(trimmed)
}

/**
 * Extracts SupplierRow entries from data rows using the given column mapping.
 */
function extractRows(
  dataRows: string[][],
  mapping: ColumnMapping,
  filePath: string,
  stats: ImportStats,
): SupplierRow[] {
  const result: SupplierRow[] = []

  for (const row of dataRows) {
    stats.totalRows++

    // Get raw MPN value
    const rawMpn = (row[mapping.mpn] || '').trim()

    // Skip rows with empty MPN
    if (!rawMpn) {
      stats.skippedRows++
      continue
    }

    // Get raw brand value
    const rawBrand = mapping.brand >= 0 ? (row[mapping.brand] || '').trim() : ''

    // Get optional fields
    const rawPackage = mapping.package !== undefined ? (row[mapping.package] || '').trim() : undefined
    const rawDateCode = mapping.dateCode !== undefined ? (row[mapping.dateCode] || '').trim() : undefined

    // Normalize MPN
    const canonicalMpn = normalizeMpn(rawMpn)

    // Map brand
    const brandResult = mapBrand(rawBrand)

    const supplierRow: SupplierRow = {
      originalMpn: rawMpn,
      canonicalMpn,
      originalBrand: rawBrand,
      canonicalBrand: brandResult.name,
      sourceFile: filePath,
    }

    // Add optional fields only if non-empty
    if (rawPackage) {
      supplierRow.package = rawPackage
    }
    if (rawDateCode) {
      supplierRow.dateCode = rawDateCode
    }

    result.push(supplierRow)
  }

  return result
}
