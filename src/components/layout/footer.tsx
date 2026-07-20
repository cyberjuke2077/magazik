import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
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

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-white text-ink">
      <div className="bg-azure text-white">
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
      </div>

      <div className="mx-auto max-w-[1380px] px-4 py-9 lg:px-0">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex text-2xl font-extrabold tracking-[-0.055em] text-ink">
              electro<span className="text-azure">magaz.</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-3">
              Электронные компоненты для разработки и серийного производства. Подбор по MPN, документы и поставка по России.
            </p>
            <div className="mt-5 grid gap-2.5 text-sm text-ink-2">
              <a href={`tel:${COMPANY.phone.raw}`} className="flex items-center gap-2.5 transition-colors hover:text-azure"><Phone size={15} />{COMPANY.phone.display}</a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2.5 transition-colors hover:text-azure"><Mail size={15} />{COMPANY.email}</a>
              <span className="flex items-center gap-2.5"><MapPin size={15} />{COMPANY.city}</span>
            </div>
          </div>

          {footerLinks.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h3 className="mb-4 text-sm font-bold text-ink">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}><Link href={link.href} className="text-sm text-ink-3 transition-colors hover:text-azure">{link.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-[var(--border)] bg-white p-2">
              <Image src="/rst-quality.svg" alt="Знак качества РСТ" width={104} height={30} className="h-7 w-auto" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-ink"><ShieldCheck size={15} className="text-azure" />Сертифицированная продукция</div>
              <p className="mt-0.5 text-xs text-ink-4">Документы предоставляются при оформлении поставки.</p>
            </div>
          </div>
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
