import type { Metadata } from 'next'
import Link from 'next/link'
import { Briefcase, MapPin, Clock, ChevronRight, Mail, TrendingUp, Users, Award } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Вакансии',
  description:
    'Открытые вакансии в Electromagaz: менеджер по продажам, инженер техподдержки, специалист по закупкам, разработчик.',
}

const benefits = [
  { icon: TrendingUp, title: 'Понятный рост', desc: 'Прозрачная система KPI и регулярные пересмотры зарплат' },
  { icon: Users, title: 'Дружная команда', desc: 'Работаем без токсичности, помогаем друг другу с задачами' },
  { icon: Award, title: 'Обучение за счёт компании', desc: 'Конференции, курсы, литература - оплачиваем по запросу' },
  { icon: Clock, title: 'Гибкий график', desc: 'Возможность гибридного формата и индивидуального графика' },
]

const positions = [
  {
    title: 'Менеджер по продажам B2B',
    location: 'Москва',
    type: 'Полный день',
    salary: 'от 120 000 ₽ + %',
    desc: 'Работа с входящими запросами от юридических лиц, формирование коммерческих предложений, ведение клиентов от запроса до отгрузки.',
    skills: ['Опыт B2B-продаж от 1 года', 'Грамотная речь', 'Знание Excel'],
  },
  {
    title: 'Инженер технической поддержки',
    location: 'Москва / удалённо',
    type: 'Полный день',
    salary: 'от 140 000 ₽',
    desc: 'Подбор аналогов компонентов, консультация клиентов по техническим вопросам, работа с datasheet и техническими спецификациями.',
    skills: ['Образование РЭА / схемотехника', 'Английский B2+', 'Опыт работы с электроникой'],
  },
  {
    title: 'Специалист по закупкам',
    location: 'Москва',
    type: 'Полный день',
    salary: 'от 130 000 ₽',
    desc: 'Поиск компонентов у российских и зарубежных поставщиков, ведение переговоров, контроль сроков и качества поставок.',
    skills: ['Опыт закупок от 2 лет', 'Английский B2+', 'Понимание ВЭД'],
  },
  {
    title: 'Backend-разработчик (Node.js / TypeScript)',
    location: 'Удалённо',
    type: 'Полный день',
    salary: 'от 250 000 ₽',
    desc: 'Развитие платформы Electromagaz: backend на Next.js + tRPC, работа с PostgreSQL и Meilisearch, интеграции с поставщиками.',
    skills: ['TypeScript, Node.js', 'PostgreSQL, Prisma', 'Опыт от 3 лет'],
  },
]

export default function JobsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Header />
      <StickyNav />

      <main className="flex-1">
        <div className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[1440px] px-3 py-2 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-ink-4">
              <Link href="/" className="hover:text-ink-3 transition-colors">Главная</Link>
              <span>›</span>
              <span className="text-ink-3">Вакансии</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-3 py-6 sm:px-6">
          <h1 className="mb-1 text-2xl font-bold text-ink">Вакансии</h1>
          <p className="text-sm text-ink-3 mb-8 max-w-3xl">
            Растём в области B2B-поставок электронных компонентов и ищем людей, которые помогут
            сделать процессы быстрее и удобнее для клиентов.
          </p>

          {/* Benefits */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {benefits.map((b) => (
              <div key={b.title} className="p-5 border border-[var(--border)] rounded bg-white">
                <div className="flex size-9 items-center justify-center bg-azure-light mb-3 rounded">
                  <b.icon size={16} className="text-azure" />
                </div>
                <h3 className="text-sm font-bold text-ink mb-1">{b.title}</h3>
                <p className="text-xs text-ink-3 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </section>

          {/* Positions */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-ink mb-5">Открытые позиции</h2>
            <div className="space-y-3">
              {positions.map((p) => (
                <div
                  key={p.title}
                  className="p-6 border border-[var(--border)] rounded bg-white hover:border-azure hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase size={14} className="text-azure" />
                        <h3 className="text-base font-bold text-ink">{p.title}</h3>
                      </div>
                      <p className="text-sm text-ink-3 leading-relaxed mb-3">{p.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 text-xs bg-gray-100 text-ink-2 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="lg:w-56 lg:shrink-0 lg:pl-6 lg:border-l border-[var(--border)]">
                      <div className="flex items-center gap-1.5 text-xs text-ink-3 mb-1.5">
                        <MapPin size={12} />
                        {p.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-3 mb-3">
                        <Clock size={12} />
                        {p.type}
                      </div>
                      <div className="text-sm font-bold text-ink mb-3">{p.salary}</div>
                      <a
                        href={`mailto:hr@electromagaz.ru?subject=Вакансия: ${p.title}`}
                        className="flex h-9 items-center justify-center gap-1.5 rounded bg-accent px-4 text-xs font-bold text-white transition-colors hover:bg-accent-hover"
                      >
                        Откликнуться
                        <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Generic CTA */}
          <section className="p-8 bg-azure-light border border-blue-200 rounded text-center">
            <h2 className="text-lg font-bold text-ink mb-2">Не нашли подходящую вакансию?</h2>
            <p className="text-sm text-ink-3 mb-5 max-w-xl mx-auto leading-relaxed">
              Пришлите резюме на hr@electromagaz.ru - рассмотрим и свяжемся, когда появится релевантная позиция.
            </p>
            <a
              href="mailto:hr@electromagaz.ru"
              className="inline-flex h-11 items-center gap-2 rounded bg-accent px-6 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
            >
              <Mail size={14} />
              Отправить резюме
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
