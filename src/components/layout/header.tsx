'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, MapPin, Phone, Menu, X } from 'lucide-react'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="w-full">
      <div className="mx-auto max-w-[1400px] px-4">
          <div className="flex items-center gap-12 h-[88px]">

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <div className="text-[2.6rem] font-black text-gray-900 tracking-tight leading-none">
                electro<span className="text-[#0066cc]">magaz</span><span className="text-[#0066cc]">.</span>
              </div>
            </Link>

            {/* Address */}
            <div className="hidden lg:flex flex-col leading-snug gap-1">
              <a href="#" className="flex items-center gap-1.5 text-[17px] font-bold text-gray-800 hover:text-[#0066cc] transition-colors">
                <MapPin size={17} className="text-[#0066cc]" />
                Москва
              </a>
              <span className="text-[14px] text-gray-400 pl-[24px]">Магазины и оптовые отделы</span>
            </div>

            {/* Phone */}
            <div className="hidden lg:flex flex-col leading-snug gap-1">
              <a href="tel:+78005553535" className="flex items-center gap-1.5 text-[17px] font-bold text-gray-800 hover:text-[#0066cc] transition-colors">
                <Phone size={17} className="text-[#0066cc]" />
                8 (800) 555-35-35
              </a>
              <a href="mailto:info@electromagaz.ru" className="text-[14px] text-gray-400 pl-[24px] hover:text-[#0066cc] transition-colors">
                info@electromagaz.ru
              </a>
            </div>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-8 ml-auto text-[15px] font-medium text-gray-600">
              <Link href="/delivery" className="hover:text-[#0066cc] transition-colors">Доставка</Link>
              <Link href="/brands"   className="hover:text-[#0066cc] transition-colors">Оплата</Link>
              <a href="mailto:info@electromagaz.ru" className="flex items-center gap-1.5 hover:text-[#0066cc] transition-colors">
                <Mail size={15} />
                Написать
              </a>
            </nav>

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden ml-auto flex items-center justify-center size-9 text-gray-600 hover:bg-gray-100 transition-all"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-gray-200 bg-white animate-slide-down">
          <div className="mx-auto max-w-[1400px] px-4 py-3 space-y-1">
            <Link href="/catalog"  onClick={() => setMobileOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Каталог</Link>
            <Link href="/brands"   onClick={() => setMobileOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Бренды</Link>
            <Link href="/delivery" onClick={() => setMobileOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Доставка</Link>
          </div>
        </div>
      )}
    </header>
  )
}
