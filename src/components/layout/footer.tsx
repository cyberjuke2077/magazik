import Link from 'next/link'
import { Zap, Mail, Phone, MapPin, Send } from 'lucide-react'

const footerLinks = {
  catalog: {
    title: 'Каталог',
    links: [
      { label: 'Резисторы', href: '/catalog?category=rezistory' },
      { label: 'Конденсаторы', href: '/catalog?category=kondensatory' },
      { label: 'Микросхемы', href: '/catalog?category=mikroskhemy' },
      { label: 'Транзисторы', href: '/catalog?category=tranzistory' },
      { label: 'Датчики', href: '/catalog?category=datchiki' },
      { label: 'Контроллеры', href: '/catalog?category=kontrollery' },
    ],
  },
  company: {
    title: 'Компания',
    links: [
      { label: 'О нас', href: '/about' },
      { label: 'Оптовые цены', href: '/wholesale' },
      { label: 'Сертификаты', href: '/certificates' },
      { label: 'Вакансии', href: '/jobs' },
      { label: 'Блог', href: '/blog' },
    ],
  },
  support: {
    title: 'Поддержка',
    links: [
      { label: 'Доставка и оплата', href: '/delivery' },
      { label: 'Возврат товара', href: '/returns' },
      { label: 'Техподдержка', href: '/support' },
      { label: 'Документы', href: '/docs' },
      { label: 'API', href: '/api-docs' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#07080f]">
      {/* Newsletter */}
      <div className="border-b border-white/5 bg-[#0d0f1e]/50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#f1f5f9]">Новинки и спецпредложения</h3>
              <p className="text-xs text-[#64748b] mt-0.5">Узнавайте первыми о поступлениях и скидках</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 sm:w-64 h-9 px-3 text-sm bg-[#111427] border border-white/8 rounded-lg text-[#f1f5f9] placeholder-[#64748b] outline-none focus:border-[#22d3ee]/40 focus:ring-2 focus:ring-[#22d3ee]/10 transition-all"
              />
              <button className="flex items-center gap-1.5 h-9 px-4 text-sm font-medium text-[#07080f] bg-[#22d3ee] hover:bg-[#22d3ee]/90 rounded-lg transition-all btn-primary shrink-0">
                <Send size={13} />
                Подписаться
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#22d3ee]/10 ring-1 ring-[#22d3ee]/20">
                <Zap size={16} className="text-[#22d3ee]" />
              </div>
              <span className="text-base font-bold">
                <span className="text-[#f1f5f9]">ELECTRO</span>
                <span className="text-[#22d3ee]">MAGAZ</span>
              </span>
            </Link>
            <p className="text-sm text-[#64748b] leading-relaxed mb-4">
              Профессиональный поставщик электронных компонентов с 2012 года. Более 500,000 позиций в наличии.
            </p>
            <div className="space-y-2 text-xs text-[#64748b]">
              <a href="tel:+78005553535" className="flex items-center gap-2 hover:text-[#94a3b8] transition-colors">
                <Phone size={12} className="text-[#22d3ee]" />
                +7 (800) 555-35-35
              </a>
              <a href="mailto:info@electromagaz.ru" className="flex items-center gap-2 hover:text-[#94a3b8] transition-colors">
                <Mail size={12} className="text-[#22d3ee]" />
                info@electromagaz.ru
              </a>
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-[#22d3ee] shrink-0" />
                <span>Москва, ул. Радиальная, 4</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-[#f1f5f9] uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748b]">
            <span>© 2024 Electromagaz. Все права защищены.</span>
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-[#94a3b8] transition-colors">Конфиденциальность</Link>
              <span className="text-white/10">|</span>
              <Link href="/terms" className="hover:text-[#94a3b8] transition-colors">Условия</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
