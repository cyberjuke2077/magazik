import Link from 'next/link'
import { ArrowRight, FileSpreadsheet, Phone } from 'lucide-react'
import { COMPANY } from '@/lib/company'

export function B2bCta() {
  return (
    <section className="bg-canvas py-5">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
        <div className="grid gap-5 rounded-[var(--radius-panel)] border border-[var(--border)] bg-white p-5 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <span className="flex size-12 items-center justify-center rounded-[var(--radius-card)] bg-azure-light text-azure">
            <FileSpreadsheet size={24} />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Рассчитаем поставку по вашей спецификации
            </h2>
            <p className="mt-1 max-w-[70ch] text-sm text-ink-3">
              Проверим наличие, подберём аналоги и подготовим коммерческое предложение для юрлица.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/request-quote" className="ui-btn ui-btn-primary group">
              Перейти в корзину
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a href={`tel:${COMPANY.phone.raw}`} className="ui-btn ui-btn-secondary">
              <Phone size={17} />
              Позвонить
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
