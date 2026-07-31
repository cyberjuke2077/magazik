import { Replace, PackageCheck, FileText, Headset } from 'lucide-react'
import { SectionHeader } from './section-header'
import { Reveal } from './reveal'

const benefits = [
  { icon: Replace, title: 'Подбор аналогов', desc: 'Найдём замену под нужные параметры, корпус и бюджет с учётом доступности.' },
  { icon: PackageCheck, title: 'Поставка под заказ', desc: 'Привезём позиции, которых нет в наличии, и согласуем сроки заранее.' },
  { icon: FileText, title: 'Документы для юрлиц', desc: 'Работаем по безналу с НДС, выдаём полный пакет закрывающих документов.' },
  { icon: Headset, title: 'Коммерческое предложение', desc: 'Сформируем КП по вашему списку позиций и просчитаем опт.' },
]

export function Benefits() {
  return (
    <section className="section-pad bg-[#f8fafc]">
      <div className="mx-auto max-w-[1400px] px-4">
        <SectionHeader
          eyebrow="Почему мы"
          title="Не просто склад, а инженерный сервис"
          description="Помогаем закрыть спецификацию целиком: от подбора аналога до документов и поставки."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 70} className="h-full">
              <div className="ui-card ui-card-hover flex h-full flex-col p-7">
                <span className="flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-azure-light text-azure">
                  <b.icon size={24} strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-lg font-bold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-3">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
