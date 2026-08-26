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

function importCsvBytes(bytes: Buffer) {
  const dir = mkdtempSync(join(tmpdir(), 'electromagaz-import-'))
  tempDirs.push(dir)
  writeFileSync(join(dir, 'parts.csv'), bytes)
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

  it('accepts Chinese headers with required/optional qualifiers', () => {
    const { rows } = importCsv(
      '型号（必填）,封装（选填）,品牌（必填）,批号（选填）\nMAX232ESE+,SOIC-16,MAXIM/美信,24+\n',
    )

    expect(rows[0]).toMatchObject({
      canonicalMpn: 'MAX232ESE',
      canonicalBrand: 'Maxim Integrated',
      package: 'SOIC-16',
      dateCode: '24+',
    })
  })

  it('decodes a GB18030 supplier CSV', () => {
    const gb18030Hex =
      'd0cdbac5a3a8b1d8cceea3a92cc6b7c5c6a3a8b1d8cceea3a92cc5fabac5a3a8d1a1cceea3a92cb7e2d7b0a3a8d1a1cceea3a90a42544633313235454a2c496e66696e656f6e2fd3a2b7c9c1e82c2c50472d5444534f2d382d33310a'
    const { rows, stats } = importCsvBytes(Buffer.from(gb18030Hex, 'hex'))

    expect(rows[0]).toMatchObject({
      canonicalMpn: 'BTF3125EJ',
      canonicalBrand: 'Infineon Technologies',
      package: 'PG-TDSO-8-31',
    })
    expect(stats.csvFilesDecodedAsGb18030).toBe(1)
  })

  it('does not mistake quantity and supplier notes for package data', () => {
    const { rows } = importCsv(
      'XC2CV1000-5FG456C,XILINX,2980,新批次,原厂原封\nXC2PV400-6FF1152I,XILINX,49,新批次,原厂原封\n',
    )

    expect(rows).toHaveLength(2)
    expect(rows.every((row) => row.package === undefined)).toBe(true)
    expect(rows.every((row) => row.dateCode === undefined)).toBe(true)
  })

  it('infers date code and package in a headerless four-column file', () => {
    const { rows } = importCsv(
      'MSM5500,QUALCOMM,20+,BGA\nMSM5500CP90-V2400-13TR,QUALCOMM,21+,BGA\n',
    )

    expect(rows[0]).toMatchObject({
      canonicalBrand: 'Qualcomm',
      package: 'BGA',
      dateCode: '20+',
    })
  })
})
