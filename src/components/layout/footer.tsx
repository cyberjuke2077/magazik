import Link from 'next/link'
import { ArrowRight, ChevronDown, Mail, MapPin, Phone } from 'lucide-react'
import { COMPANY } from '@/lib/company'

const footerLinks = [
  {
    title: 'Покупателям',
    links: [
      { label: 'Каталог', href: '/catalog' },
      { label: 'Корзина', href: '/cart' },
      { label: 'Сравнение', href: '/compare' },
      { label: 'Доставка и оплата', href: '/delivery' },
    ],
  },
  {
    title: 'Компания',
    links: [
      { label: 'О компании', href: '/about' },
      { label: 'Производители', href: '/brands' },
      { label: 'Оптовым клиентам', href: '/wholesale' },
      { label: 'Вакансии', href: '/jobs' },
    ],
  },
  {
    title: 'Поддержка',
    links: [
      { label: 'Помощь', href: '/help' },
      { label: 'Возврат товара', href: '/returns' },
      { label: 'Техподдержка', href: '/support' },
      { label: 'Контакты', href: '/contacts' },
    ],
  },
]

function FooterLinks({ section }: { section: typeof footerLinks[number] }) {
  return <ul className="space-y-2.5">
    {section.links.map((link) => (
      <li key={link.href}><Link href={link.href} className="text-sm text-ink-3 transition-colors hover:text-azure">{link.label}</Link></li>
    ))}
  </ul>
}

function FooterNavigation({ compact }: { compact: boolean }) {
  return <>{footerLinks.map((section) => (
    <div key={section.title}>
      <nav aria-label={section.title} className={compact ? 'hidden lg:block' : ''}>
        <h3 className="mb-4 text-sm font-bold text-ink">{section.title}</h3>
        <FooterLinks section={section} />
      </nav>
      {compact && <details className="group border-b border-black/8 py-3 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
          {section.title}<ChevronDown size={16} className="transition-transform group-open:rotate-180" />
        </summary>
        <nav aria-label={section.title} className="pt-4"><FooterLinks section={section} /></nav>
      </details>}
    </div>
  ))}</>
}

export function Footer({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white text-ink">
      {!compact && <div className="bg-azure text-white">
        <div className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-5 px-4 py-7 md:flex-row md:items-center lg:px-0">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.02em] md:text-2xl">Соберите корзину по спецификации</h2>
            <p className="mt-1 text-sm text-white/78">Добавьте позиции по MPN. Цены и сроки подтвердим в коммерческом предложении.</p>
          </div>
          <Link href="/cart" className="group flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-azure transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]">
            Перейти в корзину
            <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>}

      <div className={`mx-auto max-w-[1380px] px-4 lg:px-0 ${compact ? 'py-6' : 'py-9'}`}>
        <div className={compact ? 'grid lg:grid-cols-[1.25fr_1fr_1fr_1fr] lg:gap-8' : 'grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]'}>
          <div className={compact ? 'pb-4 lg:pb-0' : ''}>
            <Link href="/" className="inline-flex text-2xl font-extrabold tracking-[-0.055em] text-ink">
              electro<span className="text-azure">magaz.</span>
            </Link>
            {!compact && <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-3">
              Электронные компоненты для разработки и серийного производства. Подбор по MPN, документы и поставка по России.
            </p>}
            <div className={`${compact ? 'mt-4 flex flex-wrap gap-x-5 gap-y-2.5 lg:grid' : 'mt-5 grid gap-2.5'} text-sm text-ink-2`}>
              <a href={`tel:${COMPANY.phone.raw}`} className="flex items-center gap-2.5 transition-colors hover:text-azure"><Phone size={15} />{COMPANY.phone.display}</a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2.5 transition-colors hover:text-azure"><Mail size={15} />{COMPANY.email}</a>
              <span className="flex items-center gap-2.5"><MapPin size={15} />{COMPANY.city}</span>
            </div>
          </div>

          <FooterNavigation compact={compact} />
        </div>

        <div className={`${compact ? 'mt-5 pt-4' : 'mt-8 pt-6'} flex flex-col gap-5 border-t border-[var(--border)] sm:flex-row sm:items-center sm:justify-end`}>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-4">
            <Link href="/offer" className="hover:text-azure">Публичная оферта</Link>
            <Link href="/privacy" className="hover:text-azure">Политика ПДн</Link>
            <Link href="/terms" className="hover:text-azure">Условия</Link>
            <Link href="/legal" className="hover:text-azure">Реквизиты</Link>
          </div>
        </div>

        <div className="mt-5 text-xs text-ink-4">
          © {new Date().getFullYear()} {COMPANY.brand}. {COMPANY.legalName.replace(/\s*\[ЗАПОЛНИТЬ\]/g, '')}
        </div>
      </div>
    </footer>
  )
}
