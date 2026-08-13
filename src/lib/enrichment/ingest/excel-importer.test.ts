import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { importSupplierFiles } from './excel-importer'

const tempDirs: string[] = []

function importCsv(content: string) {
  const dir = mkdtempSync(join(tmpdir(), 'electromagaz-import-'))
  tempDirs.push(dir)
  writeFileSync(join(dir, 'parts.csv'), content, 'utf-8')
  return importSupplierFiles(dir)
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('importSupplierFiles', () => {
  it('accepts an MPN-only customer list with an English header', () => {
    const { rows, stats } = importCsv('MPN\nSTM32F103C8T6\nADG212AKNZ\n')

    expect(rows.map((row) => row.canonicalMpn)).toEqual([
      'STM32F103C8T6',
      'ADG212AKNZ',
    ])
    expect(rows.every((row) => row.canonicalBrand === '')).toBe(true)
    expect(stats).toMatchObject({
      filesWithHeaders: 1,
      filesWithoutHeaders: 0,
      totalRows: 2,
    })
  })

  it('accepts Russian customer headers and maps a supplied brand', () => {
    const { rows } = importCsv(
      'Артикул,Производитель\nSTM32F103C8T6,ST\n',
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      canonicalMpn: 'STM32F103C8T6',
      canonicalBrand: 'STMicroelectronics',
    })
  })

  it('accepts a headerless one-column MPN list', () => {
    const { rows, stats } = importCsv('STM32F103C8T6\nATMEGA328P-PU\n')

    expect(rows).toHaveLength(2)
    expect(stats.filesWithoutHeaders).toBe(1)
  })
})
