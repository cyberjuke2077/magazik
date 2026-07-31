import { describe, expect, it } from 'vitest'

import { buildComparisonSpecRows, normalizeSpecKey } from './compare-specs'

describe('comparison specification normalization', () => {
  it('merges equivalent Russian and English keys', () => {
    expect(normalizeSpecKey('Корпус:')).toBe('Корпус')
    expect(normalizeSpecKey('Package / Case')).toBe('Корпус')
  })

  it('marks missing or unequal values as differences', () => {
    const rows = buildComparisonSpecRows([
      { id: 'a', specs: { Корпус: 'LQFP-48', 'Напряжение питания': '3.3 V' } },
      { id: 'b', specs: { 'Package / Case': 'LQFP-48' } },
    ])

    expect(rows.find((row) => row.key === 'Корпус')?.isDifferent).toBe(false)
    expect(
      rows.find((row) => row.key === 'Напряжение питания')?.isDifferent,
    ).toBe(true)
  })
})
