import { Boxes, Truck, FileCheck2, Headset } from 'lucide-react'

interface TrustBadgesProps {
  totalProducts: number
  sectionsCount: number
}

/** Полоса доверия - фактические данные, без рекламных заявлений. */
export function TrustBadges({ totalProducts, sectionsCount }: TrustBadgesProps) {
  const items = [
    { icon: Boxes, value: `${totalProducts.toLocaleString('ru-RU')}`, label: 'позиций в каталоге' },
    { icon: Truck, value: 'По всей РФ', label: 'отгрузка со склада в Москве' },
    { icon: FileCheck2, value: 'Безнал с НДС', label: 'полный пакет документов' },
    { icon: Headset, value: `${sectionsCount} разделов`, label: 'подбор и техподдержка' },
  ]
  return (
    <section className="bg-canvas py-3">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
        <ul className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white md:grid-cols-4">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-2.5 border-b border-r border-[var(--border)] p-3 last:border-r-0 md:border-b-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-azure-light text-azure">
                <it.icon size={18} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-tight text-ink">{it.value}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-ink-3">{it.label}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
