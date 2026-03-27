import Link from 'next/link'
import { Zap, Mail, Phone, MapPin, Send } from 'lucide-react'

const footerLinks = {
  catalog: {
    title: 'Каталог',
    links: [
      { label: 'Резисторы',    href: '/catalog?category=rezistory' },
      { label: 'Конденсаторы', href: '/catalog?category=kondensatory' },
      { label: 'Микросхемы',   href: '/catalog?category=mikroskhemy' },
      { label: 'Транзисторы',  href: '/catalog?category=tranzistory' },
      { label: 'Датчики',      href: '/catalog?category=datchiki' },
      { label: 'Контроллеры',  href: '/catalog?category=kontrollery' },
    ],
  },
  company: {
    title: 'Компания',
    links: [
      { label: 'О нас',          href: '/about' },
      { label: 'Оптовые цены',   href: '/wholesale' },
      { label: 'Бренды',         href: '/brands' },
      { label: 'Вакансии',       href: '/jobs' },
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
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Новинки и спецпредложения</h3>
              <p className="text-xs text-gray-500 mt-0.5">Узнавайте первыми о поступлениях и скидках</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 sm:w-60 h-10 px-3 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 transition-all"
              />
              <button className="flex items-center gap-1.5 h-10 px-4 text-sm font-semibold text-white bg-[#166534] hover:bg-[#15803d] rounded-xl transition-all shrink-0 shadow-sm">
                <Send size={13} />
                Подписаться
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#166534] shadow-sm">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">
                ELECTRO<span className="text-[#166534]">MAGAZ</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Профессиональный поставщик электронных компонентов с 2012 года. Более 500 000 позиций в наличии.
            </p>
            <div className="space-y-2">
              <a href="tel:+78005553535" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#166534] transition-colors">
                <Phone size={13} className="text-[#166534] shrink-0" />
                +7 (800) 555-35-35
              </a>
              <a href="mailto:info@electromagaz.ru" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#166534] transition-colors">
                <Mail size={13} className="text-[#166534] shrink-0" />
                info@electromagaz.ru
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={13} className="text-[#166534] shrink-0" />
                Москва, ул. Радиальная, 4
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
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-[#166534] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2024 Electromagaz. Все права защищены.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Конфиденциальность</Link>
            <Link href="/terms"   className="hover:text-gray-600 transition-colors">Условия</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
