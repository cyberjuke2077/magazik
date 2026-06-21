import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, Clock, FileText, XCircle, Phone, Mail, Link2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Статус заявки',
  robots: { index: false, follow: false },
}

// Покупательские формулировки статусов (мягче, чем в админке).
const STATUS_META: Record<
  string,
  { label: string; desc: string; icon: typeof Clock; cls: string }
> = {
  new: {
    label: 'Принята',
    desc: 'Заявка получена и ожидает обработки. Менеджер свяжется с вами для согласования цены и сроков.',
    icon: Clock,
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  in_progress: {
    label: 'В работе',
    desc: 'Мы готовим коммерческое предложение по вашей заявке.',
    icon: FileText,
    cls: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  quoted: {
    label: 'КП готово',
    desc: 'Коммерческое предложение подготовлено и направлено вам. Проверьте указанные контакты.',
    icon: CheckCircle,
    cls: 'bg-green-50 text-green-700 border-green-200',
  },
  rejected: {
    label: 'Отклонена',
    desc: 'К сожалению, заявка отклонена. По вопросам свяжитесь с нами любым удобным способом.',
    icon: XCircle,
    cls: 'bg-[#f8fafc] text-ink-3 border-[var(--border)]',
  },
}

export default async function QuoteStatusPage({
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

  const meta = STATUS_META[request.status] ?? STATUS_META.new
  const StatusIcon = meta.icon

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />

      <main className="flex-1 bg-[#f8fafc] py-10">
        <div className="mx-auto max-w-2xl px-4">
          {/* Статус */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-6 mb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold text-ink">Заявка на КП</h1>
                <p className="text-xs text-ink-3 mt-1">
                  Создана {request.createdAt.toLocaleDateString('ru-RU')} · позиций: {request.items.length}
                </p>
                <p className="text-xs text-ink-4 mt-1 font-mono break-all">№ {request.id}</p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${meta.cls}`}>
                <StatusIcon size={15} />
                {meta.label}
              </span>
            </div>
            <p className="text-sm text-ink-3 leading-relaxed">{meta.desc}</p>
          </div>

          {/* Сохраните ссылку */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 mb-4">
            <Link2 size={15} className="mt-0.5 shrink-0" />
            <span>
              Сохраните эту ссылку — по ней можно вернуться и проверить статус заявки в любой момент. Логин не требуется.
            </span>
          </div>

          {/* Ваши данные */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-6 mb-4">
            <h2 className="text-sm font-bold text-ink mb-3">Ваши данные</h2>
            <dl className="space-y-2 text-sm">
              {([
                ['Компания', request.companyName],
                ['ИНН', request.inn],
                ['Контактное лицо', request.contactPerson],
                ['Телефон', request.phone],
                ['Email', request.email],
                ['Адрес доставки', request.deliveryAddress],
              ] as Array<[string, string | null]>)
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-ink-3 shrink-0">{label}</dt>
                    <dd className="text-ink text-right">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Позиции */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-6 mb-4">
            <h2 className="text-sm font-bold text-ink mb-3">Позиции в заявке</h2>
            <div className="space-y-3">
              {request.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{item.name}</div>
                    <div className="text-xs text-ink-3 mt-0.5">{item.partNumber}</div>
                  </div>
                  <div className="text-sm font-semibold text-ink ml-4 shrink-0">{item.quantity} шт.</div>
                </div>
              ))}
            </div>
          </div>

          {/* Контакты */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-sm font-bold text-ink mb-3">Остались вопросы?</h2>
            <div className="space-y-2">
              <a href={`tel:${COMPANY.phone.raw}`} className="flex items-center gap-2 text-sm text-ink-2 hover:text-azure transition-colors">
                <Phone size={16} className="text-azure" />
                {COMPANY.phone.display}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 text-sm text-ink-2 hover:text-azure transition-colors">
                <Mail size={16} className="text-azure" />
                {COMPANY.email}
              </a>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold text-ink-2 bg-white border border-[var(--border-2)] hover:bg-[#fafafa] rounded transition-colors"
              >
                Продолжить выбор товаров
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center h-11 px-6 text-sm font-semibold text-white bg-azure hover:bg-azure-hover rounded transition-colors"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
