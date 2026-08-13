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
  /** Files where supported headers were detected */
  filesWithHeaders: number
  /** Files where auto-detect determined no headers (data starts at row 1) */
  filesWithoutHeaders: number
  /** Files skipped because no MPN column could be identified */
  skippedFiles: number
  /** Total data rows processed (excluding header rows) */
  totalRows: number
  /** Rows skipped due to empty/null MPN */
  skippedRows: number
  /** CSV files that were not UTF-8 and were decoded as GB18030 */
  csvFilesDecodedAsGb18030: number
}

/** Supported file extensions for import */
const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv']

/**
 * Conservative MPN auto-detection for headerless files. Real orderable
 * numbers can start with a digit and contain spaces/colon, so requiring
 * both a Latin letter and a digit is safer than a narrow punctuation list.
 */
const MPN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\-+/. :_]{1,79}$/
const LATIN_LETTER_PATTERN = /[A-Za-z]/
const DIGIT_PATTERN = /\d/

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
    csvFilesDecodedAsGb18030: 0,
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
        ? readCsvFile(filePath, stats)
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
function readCsvFile(filePath: string, stats: ImportStats): string[][] {
  const bytes = fs.readFileSync(filePath)
  const content = decodeCsv(bytes, stats)
  const records: string[][] = csvParse(content, {
    skip_empty_lines: true,
    relax_column_count: true,
  })
  return records
}

function decodeCsv(bytes: Buffer, stats: ImportStats): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    stats.csvFilesDecodedAsGb18030++
    try {
      return new TextDecoder('gb18030', { fatal: true }).decode(bytes)
    } catch (err) {
      throw new Error(
        `CSV is neither valid UTF-8 nor GB18030: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }
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
    const positionalMapping = inferHeaderlessMapping(rawRows)
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
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function inferHeaderlessMapping(rows: string[][]): ColumnMapping {
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const candidates = Array.from({ length: Math.max(0, maxColumns - 2) }, (_, idx) => idx + 2)
  const packageCol = bestMatchingColumn(rows, candidates, isLikelyPackage)
  const dateCodeCol = bestMatchingColumn(
    rows,
    candidates.filter((idx) => idx !== packageCol),
    isLikelyDateCode,
  )

  return {
    mpn: 0,
    brand: maxColumns > 1 ? 1 : -1,
    package: packageCol,
    dateCode: dateCodeCol,
  }
}

function bestMatchingColumn(
  rows: string[][],
  candidates: number[],
  predicate: (value: string) => boolean,
): number | undefined {
  let best: { column: number; score: number } | undefined

  for (const column of candidates) {
    const values = rows
      .slice(0, 200)
      .map((row) => (row[column] || '').trim())
      .filter(Boolean)
    if (values.length === 0) continue

    const score = values.filter(predicate).length / values.length
    if (score >= 0.6 && (!best || score > best.score)) {
      best = { column, score }
    }
  }

  return best?.column
}

function isLikelyPackage(value: string): boolean {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '')
  if (/^(0201|0402|0603|0805|1206|1210|1812|2010|2512)$/.test(normalized)) {
    return true
  }
  return /^(?:P?G-)?(?:BGA|FBGA|VFBGA|PBGA|T?QFN|VQFN|LQFP|TQFP|QFP|SOIC|SOP|SSOP|TSSOP|TSOP|VSSOP|VSON|LFCSP|DFN|TDFN|DIP|PLCC|WLCSP|CSP|SOT|SC|TO)(?:[-_]?\d.*)?$/.test(normalized)
}

function isLikelyDateCode(value: string): boolean {
  return /^(?:\d{2,4}\+|\d{2}|(?:19|20)\d{2}|\d{2}[A-Z]\d{1,2})$/i.test(value.trim())
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

  return MPN_PATTERN.test(trimmed) && LATIN_LETTER_PATTERN.test(trimmed) && DIGIT_PATTERN.test(trimmed)
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
