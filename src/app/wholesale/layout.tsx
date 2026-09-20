import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Оптовые поставки',
  description: 'Запрос оптовой поставки электронных компонентов по MPN и спецификации.',
}

export default function WholesaleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
