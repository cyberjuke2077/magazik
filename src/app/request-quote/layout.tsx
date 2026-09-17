import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Запрос коммерческого предложения',
  description: 'Контактные данные и состав запроса на поставку электронных компонентов.',
  robots: { index: false, follow: false },
}

export default function RequestQuoteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
