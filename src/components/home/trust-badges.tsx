import { Boxes, Truck, FileCheck2, Headset } from 'lucide-react'

interface TrustBadgesProps {
  totalProducts: number
  sectionsCount: number
}

/** Полоса доверия — фактические данные, без рекламных заявлений. */
export function TrustBadges({ totalProducts, sectionsCount }: TrustBadgesProps) {
  const items = [
    { icon: Boxes, value: `${totalProducts.toLocaleString('ru-RU')}`, label: 'позиций в каталоге' },
    { icon: Truck, value: 'По всей РФ', label: 'отгрузка со склада в Москве' },
    { icon: FileCheck2, value: 'Безнал с НДС', label: 'полный пакет документов' },
    { icon: Headset, value: `${sectionsCount} разделов`, label: 'подбор и техподдержка' },
  ]
  return (
    <section className="border-y border-[var(--border)] bg-azure-dim/40">
      <div className="mx-auto max-w-[1400px] px-4">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-7 py-8 md:grid-cols-4 md:py-9">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-white text-azure shadow-[var(--shadow-sm)]">
                <it.icon size={22} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <div className="font-bold leading-tight text-ink">{it.value}</div>
                <div className="mt-0.5 text-[13px] leading-tight text-ink-3">{it.label}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
