export function formatPrice(price: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: price < 10 ? 2 : 0,
    maximumFractionDigits: price < 10 ? 2 : 0,
  }).format(price)
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}М`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}к`
  return String(n)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
