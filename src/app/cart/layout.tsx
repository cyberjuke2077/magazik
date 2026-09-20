import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Корзина',
  description: 'Выбранные электронные компоненты и переход к запросу коммерческого предложения.',
  robots: { index: false, follow: true },
}

export default function CartLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
