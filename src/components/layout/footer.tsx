import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Send, ShieldCheck } from 'lucide-react'
import { COMPANY } from '@/lib/company'

const footerLinks = {
  catalog: {
    title: 'Каталог',
    links: [
      { label: 'Усилители и компараторы',    href: '/catalog?category=usiliteli' },
      { label: 'Управление питанием',         href: '/catalog?category=pitanie' },
      { label: 'Интерфейсы и логика',         href: '/catalog?category=interfeysy' },
      { label: 'АЦП, ЦАП и преобразователи',  href: '/catalog?category=atsp-tsap' },
      { label: 'Датчики',                     href: '/catalog?category=datchiki' },
      { label: 'Микроконтроллеры и DSP',      href: '/catalog?category=mikrokontrollery' },
    ],
  },
  company: {
    title: 'Компания',
    links: [
      { label: 'О нас',    href: '/about' },
      { label: 'Бренды',   href: '/brands' },
      { label: 'Вакансии', href: '/jobs' },
    ],
  },
  support: {
    title: 'Поддержка',
    links: [
      { label: 'Доставка и оплата', href: '/delivery' },
      { label: 'Возврат товара',    href: '/returns' },
      { label: 'Техподдержка',      href: '/support' },
      { label: 'Контакты',          href: '/contacts' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      {/* Newsletter */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[1400px] px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Новинки и спецпредложения</h3>
              <p className="text-xs text-gray-500 mt-0.5">Узнавайте первыми о поступлениях и скидках</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 sm:w-60 h-10 px-3 text-sm bg-white border border-gray-200 rounded text-gray-900 placeholder-gray-400 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 focus:shadow-[0_0_0_3px_rgba(0,102,204,0.08)] transition-all"
              />
              <button className="flex items-center gap-1.5 h-10 px-4 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-all shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,102,204,0.25)]">
                <Send size={13} />
                Подписаться
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="block mb-4">
              <span className="text-xl font-bold text-gray-900 tracking-wide">
                ELECTRO<span className="text-[#0066cc]">MAGAZ</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Профессиональный поставщик электронных компонентов с {COMPANY.foundedYear} года. Более 500 000 позиций в наличии.
            </p>
            <div className="space-y-2">
              <a href={`tel:${COMPANY.phone.raw}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0066cc] transition-colors">
                <Phone size={13} className="text-[#0066cc] shrink-0" />
                {COMPANY.phone.display}
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0066cc] transition-colors">
                <Mail size={13} className="text-[#0066cc] shrink-0" />
                {COMPANY.email}
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={13} className="text-[#0066cc] shrink-0" />
                {COMPANY.city}
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-[#0066cc] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* РСТ — Знак качества */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[1400px] px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Знак */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative">
                {/* Жёлтое свечение вокруг знака */}
                <div className="absolute inset-0 rounded bg-[#EAE60E]/20 blur-md scale-110 pointer-events-none" />
                <div className="relative bg-white border-2 border-[#EAE60E]/60 rounded p-2 shadow-[0_4px_12px_rgba(234,230,14,0.15)]">
                  <Image
                    src="/rst-quality.svg"
                    alt="Знак качества РСТ — Российский стандарт"
                    width={160}
                    height={38}
                    className="h-9 w-auto"
                  />
                </div>
              </div>
            </div>

            {/* Текст */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                <ShieldCheck size={14} className="text-[#0066cc] shrink-0" />
                <span className="text-sm font-bold text-gray-800">Сертифицированная продукция</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xl">
                Все компоненты соответствуют требованиям российского законодательства.
                Работаем в соответствии с ГОСТ и техническими регламентами Таможенного союза.
                Сертификаты и декларации соответствия предоставляются по запросу.
              </p>
            </div>


          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 py-5">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-xs text-gray-500">
              {COMPANY.legalName.replace(/\s*\[ЗАПОЛНИТЬ\]/g, '')} · ИНН {COMPANY.inn} · ОГРН {COMPANY.ogrn}
            </span>
            <span className="text-xs text-gray-400">© {new Date().getFullYear()} {COMPANY.brand}. Все права защищены.</span>
            <div className="text-sm text-gray-600">
              Разработано в{' '}
              <a
                href="https://sharashka.onrender.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0066cc] font-semibold hover:text-[#0052a3] transition-colors"
              >
                SHK Dev
              </a>
              {' '}© 2026
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
              <Link href="/offer" className="hover:text-gray-600 transition-colors">Публичная оферта</Link>
              <Link href="/privacy" className="hover:text-gray-600 transition-colors">Политика ПДн</Link>
              <Link href="/terms"   className="hover:text-gray-600 transition-colors">Условия</Link>
              <Link href="/legal"   className="hover:text-gray-600 transition-colors">Реквизиты</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
