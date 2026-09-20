import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle, Clock, FileText, Link2, Mail, Phone } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { COMPANY } from '@/lib/company'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Статус оптовой заявки',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

const STATUS_META: Record<string, {
  label: string
  description: string
  icon: typeof Clock
  className: string
}> = {
  new: {
    label: 'Принята',
    description: 'Заявка сохранена и ожидает обработки менеджером.',
    icon: Clock,
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  in_progress: {
    label: 'В работе',
    description: 'Менеджер проверяет спецификацию и условия поставки.',
    icon: FileText,
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  closed: {
    label: 'Обработана',
    description: 'Работа по заявке завершена. Детали можно уточнить у менеджера по номеру заявки.',
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-700',
  },
}

export default async function WholesaleStatusPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!/^[a-z0-9]{20,40}$/.test(id)) notFound()

  const request = await prisma.wholesaleLead.findUnique({
    where: { id },
    select: { id: true, status: true, createdAt: true },
  })
  if (!request) notFound()

  const status = STATUS_META[request.status] ?? STATUS_META.new
  const StatusIcon = status.icon

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />
      <main className="flex-1 py-6">
        <div className="mx-auto max-w-3xl px-3 sm:px-6">
          <section className="mb-4 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-[-0.03em] text-ink">Статус оптовой заявки</h1>
                <p className="mt-1 text-xs text-ink-3">
                  Создана {request.createdAt.toLocaleDateString('ru-RU')}
                </p>
                <p className="mt-1 break-all font-mono text-xs text-ink-4">№ {request.id}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-3 py-1 text-sm font-medium ${status.className}`}>
                <StatusIcon size={15} />
                {status.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink-3">{status.description}</p>
          </section>

          <div className="mb-4 flex items-start gap-2 border-l-4 border-azure bg-azure-light p-3 text-xs text-ink-2">
            <Link2 size={15} className="mt-0.5 shrink-0" />
            <span>Сохраните эту ссылку для проверки статуса. Не передавайте её посторонним.</span>
          </div>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-ink">Остались вопросы?</h2>
            <div className="space-y-2">
              <a href={`tel:${COMPANY.phone.raw}`} className="flex items-center gap-2 text-sm text-ink-2 hover:text-azure">
                <Phone size={16} className="text-azure" />
                {COMPANY.phone.display}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 text-sm text-ink-2 hover:text-azure">
                <Mail size={16} className="text-azure" />
                {COMPANY.email}
              </a>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/account" className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border-2)] px-6 text-sm font-semibold text-ink-2">
                Ваши заявки
              </Link>
              <Link href="/wholesale#request-form" className="inline-flex h-11 items-center justify-center rounded-xl bg-azure px-6 text-sm font-bold text-white">
                Новая заявка
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
