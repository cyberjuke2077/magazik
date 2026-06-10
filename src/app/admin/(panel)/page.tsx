import Link from 'next/link'
import { Inbox, Package, Tag, AlertTriangle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { RequestStatusBadge } from './requests/status-badge'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [newRequests, totalRequests, totalProducts, pricedProducts, latest] =
    await Promise.all([
      prisma.quoteRequest.count({ where: { status: 'new' } }),
      prisma.quoteRequest.count(),
      prisma.product.count(),
      prisma.product.count({ where: { price: { not: null } } }),
      prisma.quoteRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { _count: { select: { items: true } } },
      }),
    ])
  const unpriced = totalProducts - pricedProducts

  const cards = [
    { label: 'Новые заявки', value: newRequests, icon: Inbox, href: '/admin/requests?status=new', accent: newRequests > 0 },
    { label: 'Всего заявок', value: totalRequests, icon: Inbox, href: '/admin/requests' },
    { label: 'Товаров в каталоге', value: totalProducts, icon: Package, href: '/admin/products' },
    { label: 'С ценой', value: pricedProducts, icon: Tag, href: '/admin/products?filter=priced' },
    { label: 'Без цены', value: unpriced, icon: AlertTriangle, href: '/admin/products?filter=unpriced' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Дашборд</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className={`p-4 rounded-xl border bg-white hover:shadow-sm transition-shadow ${
              accent ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
            }`}
          >
            <Icon className="w-4 h-4 text-gray-400 mb-2" />
            <div className="text-2xl font-semibold text-gray-900">
              {value.toLocaleString('ru-RU')}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-gray-900">Последние заявки</h2>
          <Link href="/admin/requests" className="text-sm text-gray-500 hover:text-gray-900">
            Все заявки →
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 text-center">
            Заявок пока нет
          </p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {latest.map((r) => (
              <Link
                key={r.id}
                href={`/admin/requests/${r.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {r.companyName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.contactPerson} · {r._count.items} поз. ·{' '}
                    {r.createdAt.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <RequestStatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
