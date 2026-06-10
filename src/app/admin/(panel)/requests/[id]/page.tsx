import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { RequestStatusBadge } from '../status-badge'
import { RequestStatusSelect } from './status-select'

export const dynamic = 'force-dynamic'

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const request = await prisma.quoteRequest.findUnique({
    where: { id },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  })
  if (!request) notFound()

  const fields: Array<[string, string | null]> = [
    ['Компания', request.companyName],
    ['ИНН', request.inn],
    ['Контактное лицо', request.contactPerson],
    ['Телефон', request.phone],
    ['Email', request.email],
    ['Адрес доставки', request.deliveryAddress],
    [
      'Желаемая дата',
      request.desiredDeliveryDate?.toLocaleDateString('ru-RU') ?? null,
    ],
    ['Комментарий', request.comment],
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/requests"
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 flex-1 min-w-0 truncate">
          Заявка от {request.companyName}
        </h1>
        <RequestStatusBadge status={request.status} />
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>
          Создана{' '}
          {request.createdAt.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}
        </span>
        <span className="ml-auto flex items-center gap-2">
          Статус: <RequestStatusSelect requestId={request.id} current={request.status} />
        </span>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Контактные данные</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {fields
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="text-gray-900 mt-0.5 break-words">{value}</dd>
              </div>
            ))}
        </dl>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <h2 className="text-sm font-medium text-gray-900 px-5 pt-5 pb-3">
          Позиции ({request.items.length})
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-5 py-2 font-medium">Артикул</th>
              <th className="px-5 py-2 font-medium">Наименование</th>
              <th className="px-5 py-2 font-medium text-right">Кол-во</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {request.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-2.5 font-mono text-xs text-gray-600">
                  {item.partNumber}
                </td>
                <td className="px-5 py-2.5 text-gray-900">{item.name}</td>
                <td className="px-5 py-2.5 text-right text-gray-900">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex gap-3">
        <a
          href={`mailto:${request.email}`}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Написать на email
        </a>
        <a
          href={`tel:${request.phone.replace(/[^\d+]/g, '')}`}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Позвонить
        </a>
      </div>
    </div>
  )
}
