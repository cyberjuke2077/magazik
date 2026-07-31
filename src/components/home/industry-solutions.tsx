import Link from 'next/link'
import { Factory, HeartPulse, Car, Radio, BatteryCharging, Bot, ArrowUpRight } from 'lucide-react'
import { SectionHeader } from './section-header'
import { Reveal } from './reveal'

const industries = [
  { icon: Factory, title: 'Промышленная автоматизация', desc: 'ПЛК, драйверы, силовые ключи и интерфейсы для АСУ ТП.' },
  { icon: HeartPulse, title: 'Медицинская техника', desc: 'Прецизионные АЦП, малошумящие усилители, изоляция.' },
  { icon: Car, title: 'Автоэлектроника', desc: 'Компоненты AEC-Q, CAN/LIN, управление питанием.' },
  { icon: Radio, title: 'Телеком и IoT', desc: 'Радиомодули, МК с BLE/Wi-Fi, антенны и интерфейсы.' },
  { icon: BatteryCharging, title: 'Энергетика и питание', desc: 'DC-DC, зарядные контроллеры, MOSFET и диоды.' },
  { icon: Bot, title: 'Робототехника', desc: 'Драйверы моторов, датчики положения, МК и логика.' },
]

export function IndustrySolutions() {
  return (
    <section className="section-pad bg-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <SectionHeader
          eyebrow="Решения по отраслям"
          title="Компоненты под вашу задачу"
          description="Подбираем элементную базу под требования отрасли — от прототипа до серийной поставки."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {industries.map((it, i) => (
            <Reveal key={it.title} delay={(i % 3) * 70} className="h-full">
              <Link
                href="/catalog"
                className="group ui-card ui-card-hover flex h-full items-start gap-4 p-7"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-azure-light text-azure transition-colors group-hover:bg-azure group-hover:text-white">
                  <it.icon size={24} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold leading-snug text-ink transition-colors group-hover:text-azure">
                      {it.title}
                    </h3>
                    <ArrowUpRight
                      size={18}
                      className="shrink-0 text-ink-4 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-azure"
                    />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-3">{it.desc}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
