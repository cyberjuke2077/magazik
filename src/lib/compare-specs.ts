export interface ComparableProduct {
  id: string
  specs: Record<string, string>
}

export interface ComparisonSpecRow {
  key: string
  values: Record<string, string | null>
  isDifferent: boolean
}

const SPEC_ALIASES: Array<[RegExp, string]> = [
  [/^(корпус|package|package \/ case)$/i, 'Корпус'],
  [/^(напряжение питания|supply voltage|operating supply voltage)$/i, 'Напряжение питания'],
  [/^(рабочая температура|operating temperature|temperature range)$/i, 'Рабочая температура'],
  [/^(тактовая частота|clock frequency|maximum clock frequency)$/i, 'Тактовая частота'],
  [/^(производитель|manufacturer)$/i, 'Производитель'],
]

export function normalizeSpecKey(key: string): string {
  const cleaned = key.replace(/\s+/g, ' ').replace(/:\s*$/, '').trim()
  const alias = SPEC_ALIASES.find(([pattern]) => pattern.test(cleaned))
  return alias?.[1] ?? cleaned
}

function normalizeSpecValue(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function buildComparisonSpecRows(
  products: ComparableProduct[],
): ComparisonSpecRow[] {
  const grouped = new Map<string, Map<string, string>>()

  for (const product of products) {
    for (const [rawKey, value] of Object.entries(product.specs)) {
      const key = normalizeSpecKey(rawKey)
      if (!key) continue
      const byProduct = grouped.get(key) ?? new Map<string, string>()
      if (!byProduct.has(product.id)) byProduct.set(product.id, value)
      grouped.set(key, byProduct)
    }
  }

  return Array.from(grouped.entries())
    .map(([key, byProduct]) => {
      const values = Object.fromEntries(
        products.map((product) => [
          product.id,
          byProduct.get(product.id) ?? null,
        ]),
      )
      const normalized = products.map((product) =>
        normalizeSpecValue(values[product.id]),
      )
      return {
        key,
        values,
        isDifferent: new Set(normalized).size > 1,
      }
    })
    .sort((a, b) => a.key.localeCompare(b.key, 'ru'))
}
