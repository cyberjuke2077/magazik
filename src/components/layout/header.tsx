'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Zap, Mail, Truck, MapPin, Phone, Menu, X } from 'lucide-react'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="w-full bg-white">

      {/* ══════════════════════════════════
          ROW 1 — logo + contacts + links
          Скроллится и уходит вверх
      ══════════════════════════════════ */}
      <div>
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="flex items-center gap-8 h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex size-9 items-center justify-center bg-[#0066cc]">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <div className="text-xl font-black text-gray-900 leading-none tracking-tight">
                  electro<span className="text-[#0066cc]">magaz</span><span className="text-[#0066cc]">.</span>
                </div>
                <div className="text-[10px] text-gray-400 leading-none mt-0.5">
                  электронные компоненты
                </div>
              </div>
            </Link>

            {/* Address */}
            <div className="hidden lg:flex flex-col leading-tight">
              <a href="#" className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-[#0066cc] transition-colors">
                <MapPin size={13} className="text-[#0066cc]" />
                Москва
              </a>
              <span className="text-xs text-gray-400 ml-[17px]">ул. Радиальная, 4</span>
            </div>

            {/* Phone */}
            <div className="hidden lg:flex flex-col leading-tight">
              <a href="tel:+78005553535" className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-[#0066cc] transition-colors">
                <Phone size={13} className="text-[#0066cc]" />
                8 (800) 555-35-35
              </a>
              <a href="mailto:info@electromagaz.ru" className="text-xs text-gray-400 ml-[17px] hover:text-[#0066cc] transition-colors">
                info@electromagaz.ru
              </a>
            </div>

            {/* Delivery badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm text-gray-700 hover:border-[#0066cc] hover:text-[#0066cc] transition-colors cursor-default">
              <Truck size={13} className="text-[#0066cc]" />
              Доставка 1–2 недели
            </div>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-5 ml-auto text-sm text-gray-600">
              <Link href="/delivery" className="hover:text-[#0066cc] transition-colors">Доставка</Link>
              <Link href="/brands"   className="hover:text-[#0066cc] transition-colors">Бренды</Link>
              <a href="mailto:info@electromagaz.ru" className="flex items-center gap-1 hover:text-[#0066cc] transition-colors">
                <Mail size={12} />
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
