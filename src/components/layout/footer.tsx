import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, ShieldCheck, ArrowRight } from 'lucide-react'
import { COMPANY } from '@/lib/company'

const footerLinks = {
  catalog: {
    title: 'Каталог',
    links: [
      { label: 'Усилители и компараторы', href: '/catalog?category=usiliteli' },
      { label: 'Управление питанием', href: '/catalog?category=pitanie' },
      { label: 'Интерфейсы и логика', href: '/catalog?category=interfeysy' },
      { label: 'АЦП, ЦАП и преобразователи', href: '/catalog?category=atsp-tsap' },
      { label: 'Датчики', href: '/catalog?category=datchiki' },
      { label: 'Микроконтроллеры и DSP', href: '/catalog?category=mikrokontrollery' },
    ],
  },
  company: {
    title: 'Компания',
    links: [
      { label: 'О нас', href: '/about' },
      { label: 'Бренды', href: '/brands' },
      { label: 'Вакансии', href: '/jobs' },
    ],
  },
  support: {
    title: 'Поддержка',
    links: [
      { label: 'Доставка и оплата', href: '/delivery' },
      { label: 'Возврат товара', href: '/returns' },
      { label: 'Техподдержка', href: '/support' },
      { label: 'Контакты', href: '/contacts' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="mt-auto bg-[#171d2a] text-white">
      {/* CTA-полоса */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-5 px-3 py-7 sm:px-6 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-bold text-white md:text-2xl">Нужен расчёт по спецификации?</h3>
            <p className="mt-1 text-sm text-white/65">Пришлите список позиций, подберём, посчитаем и привезём.</p>
          </div>
          <Link href="/request-quote" className="ui-btn ui-btn-primary shrink-0 group">
            Запросить КП
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-[1440px] px-3 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 block">
              <span className="text-2xl font-extrabold tracking-tight text-white">
                electro<span className="text-azure-light">magaz</span>
              </span>
            </Link>
            <p className="mb-5 text-sm leading-relaxed text-white/60">
              Поставщик электронных компонентов для инженеров и производства. Подбор аналогов,
              поставка юрлицам по безналу с документами.
            </p>
            <div className="space-y-2.5">
              <a href={`tel:${COMPANY.phone.raw}`} className="flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-white">
                <Phone size={14} className="shrink-0 text-azure-light" />
                {COMPANY.phone.display}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-white">
                <Mail size={14} className="shrink-0 text-azure-light" />
                {COMPANY.email}
              </a>
              <div className="flex items-center gap-2.5 text-sm text-white/80">
                <MapPin size={14} className="shrink-0 text-azure-light" />
                {COMPANY.city}
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-white/45">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/70 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Сертификация */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="shrink-0 rounded-[var(--radius-control)] border border-[#EAE60E]/40 bg-white p-2.5">
              <Image
                src="/rst-quality.svg"
                alt="Знак качества РСТ - Российский стандарт"
                width={160}
                height={38}
                className="h-9 w-auto"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-1 flex items-center justify-center gap-1.5 sm:justify-start">
                <ShieldCheck size={15} className="shrink-0 text-azure-light" />
                <span className="text-sm font-bold text-white">Сертифицированная продукция</span>
              </div>
              <p className="mx-auto max-w-2xl text-xs leading-relaxed text-white/55 sm:mx-0">
                Сертификаты и декларации соответствия предоставляются по запросу.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="space-y-1">
              <div className="text-xs text-white/55">
                {COMPANY.legalName.replace(/\s*\[ЗАПОЛНИТЬ\]/g, '')}, ИНН {COMPANY.inn}, ОГРН {COMPANY.ogrn}
              </div>
              <div className="text-xs text-white/40">
                © {new Date().getFullYear()} {COMPANY.brand}. Все права защищены. Разработано в{' '}
                <a href="https://sharashka.onrender.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">
                  SHK Dev
                </a>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/55">
              <Link href="/offer" className="transition-colors hover:text-white">Публичная оферта</Link>
              <Link href="/privacy" className="transition-colors hover:text-white">Политика ПДн</Link>
              <Link href="/terms" className="transition-colors hover:text-white">Условия</Link>
              <Link href="/legal" className="transition-colors hover:text-white">Реквизиты</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
