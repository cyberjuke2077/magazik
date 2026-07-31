import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'

const quickLinks = [
  { title: 'MCU и DSP', description: 'Микроконтроллеры', href: '/catalog?category=mikrokontrollery' },
  { title: 'Питание', description: 'DC-DC и PMIC', href: '/catalog?category=pitanie' },
  { title: 'АЦП и ЦАП', description: 'Преобразователи', href: '/catalog?category=atsp-tsap' },
  { title: 'Интерфейсы', description: 'Логика и драйверы', href: '/catalog?category=interfeysy' },
  { title: 'RF-модули', description: 'Беспроводная связь', href: '/catalog?category=rch' },
  { title: 'Датчики', description: 'Сенсоры и измерения', href: '/catalog?category=datchiki' },
]

export function HeroSlider() {
  return (
    <section className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto max-w-[1380px] px-4 lg:px-0">
        <div className="grid overflow-hidden border-x border-[var(--border)] lg:min-h-[430px] lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]">
          <div className="flex flex-col justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <p className="mb-5 text-sm font-semibold text-azure">Поставка электронных компонентов</p>
            <h1 className="max-w-3xl text-balance text-[34px] font-bold leading-[1.04] tracking-[-0.045em] text-ink sm:text-[48px] lg:text-[54px]">
              Найдём компонент по точному MPN
            </h1>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-ink-3 sm:mt-5 sm:text-lg">
              Проверим наличие, срок поставки и документацию для разработки и серийного производства.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <Link href="/catalog" className="ui-btn ui-btn-primary">
                Открыть каталог
                <ArrowRight size={16} />
              </Link>
              <Link href="/request-quote" className="ui-btn ui-btn-secondary">
                <FileText size={16} />
                Запросить КП
              </Link>
            </div>
          </div>

          <Link
            href="/catalog"
            className="group relative min-h-[240px] overflow-hidden border-t border-[var(--border)] bg-[#dfe6ed] sm:min-h-[300px] lg:min-h-full lg:border-l lg:border-t-0"
            aria-label="Перейти в каталог электронных компонентов"
          >
            <Image
              src="/storefront/hero-components.jpg"
              alt="Электронные компоненты и печатные платы для серийного производства"
              fill
              preload
              className="object-cover object-center saturate-[0.82] transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,24,40,0.14),transparent_45%)]" />
          </Link>
        </div>

        <nav className="no-scrollbar flex overflow-x-auto border-x border-b border-[var(--border)]" aria-label="Популярные категории">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group min-w-[168px] flex-1 border-r border-[var(--border)] px-5 py-4 last:border-r-0 hover:bg-surface-muted"
            >
              <span className="block text-sm font-semibold text-ink transition-colors group-hover:text-azure">{item.title}</span>
              <span className="mt-0.5 block text-xs text-ink-4">{item.description}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
