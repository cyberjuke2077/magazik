'use client'

import Link from 'next/link'
import { CheckCircle, ArrowRight, Phone, Mail } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { StickyNav } from '@/components/layout/sticky-nav'
import { Footer } from '@/components/layout/footer'
import { CONTACT_PHONE, CONTACT_EMAIL, REQUEST_PROCESSING_TIME } from '@/lib/constants'

export default function RequestQuoteSuccessPage() {
  // Генерируем номер запроса
  const requestNumber = `REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <StickyNav />
      
      <main className="flex-1 bg-gray-50 py-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Запрос успешно отправлен!
            </h1>
            
            {/* Request Number */}
            <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                Номер вашего запроса: <span className="font-bold">{requestNumber}</span>
              </p>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              Мы получили ваш запрос на коммерческое предложение и свяжемся с вами 
              в течение <strong>{REQUEST_PROCESSING_TIME}</strong> для согласования цены, 
              сроков и условий поставки.
            </p>
            
            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-sm font-bold text-gray-900 mb-4">
                Если у вас есть вопросы, свяжитесь с нами:
              </h2>
              <div className="space-y-3">
                <a 
                  href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 text-sm text-gray-700 hover:text-[#0066cc] transition-colors"
                >
                  <Phone size={16} className="text-[#0066cc]" />
                  {CONTACT_PHONE}
                </a>
                <a 
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center justify-center gap-2 text-sm text-gray-700 hover:text-[#0066cc] transition-colors"
                >
                  <Mail size={16} className="text-[#0066cc]" />
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
              >
                Продолжить выбор товаров
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0052a3] rounded transition-colors"
              >
                На главную
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Копия запроса отправлена на указанный вами email
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
