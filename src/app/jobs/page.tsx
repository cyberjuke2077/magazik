import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { COMPANY } from '@/lib/company'

export const metadata: Metadata = {
  title: 'Вакансии',
  description: 'Информация о подтверждённых вакансиях Electromagaz.',
}

export default function JobsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main className="flex-1">
        <div className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1380px] px-4 py-2 lg:px-0">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
              <span>›</span>
              <span className="text-ink-3">Вакансии</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1380px] px-4 py-7 lg:px-0">
          <h1 className="mb-1 text-3xl font-bold tracking-[-0.035em] text-ink">Вакансии</h1>
          <p className="text-sm text-ink-3 mb-8 max-w-3xl">
            На этой странице публикуются только подтверждённые открытые позиции компании.
          </p>

          <section className="mb-12 rounded-2xl bg-white p-8 shadow-[var(--shadow-xs)]">
            <h2 className="text-xl font-bold text-ink mb-3">Подтверждённых вакансий сейчас нет</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-ink-3">
              Должности, условия работы, формат и вознаграждение появятся здесь только после
              утверждения компанией.
            </p>
          </section>

          <section className="rounded-2xl bg-azure-light p-8 text-center" data-motion-reveal>
            <h2 className="text-lg font-bold text-ink mb-2">Вопрос о работе в компании</h2>
            <p className="text-sm text-ink-3 mb-5 max-w-xl mx-auto leading-relaxed">
              Можно написать на единый рабочий адрес {COMPANY.hrEmail}. Отправка резюме не
              означает наличие открытой позиции или обязательство ответить.
            </p>
            <a
              href={`mailto:${COMPANY.hrEmail}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-azure px-6 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-azure-hover active:translate-y-0"
            >
              <Mail size={14} />
              Написать компании
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
