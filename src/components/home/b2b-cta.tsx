import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { COMPANY } from '@/lib/company'

export function B2bCta() {
  return (
    <section className="section-pad bg-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="relative overflow-hidden rounded-[var(--radius-panel)] bg-gradient-to-br from-azure to-[#0a4fa0] px-6 py-14 text-white md:px-14 md:py-20">
          {/* Декоративная сетка */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />

          <div className="relative max-w-3xl">
            <h2 className="text-balance text-3xl font-extrabold leading-tight md:text-[44px]">
              Работаете с юрлицом? Соберём поставку под вашу спецификацию
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">
              Пришлите список позиций — проверим наличие, подберём аналоги, посчитаем опт
              и отгрузим со склада в Москве по безналу с НДС.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/request-quote"
                className="ui-btn ui-btn-lg bg-white text-azure hover:bg-white/90 group"
              >
                Запросить КП
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={`tel:${COMPANY.phone.raw}`}
                className="ui-btn ui-btn-lg border border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                <Phone size={18} />
                {COMPANY.phone.display}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
