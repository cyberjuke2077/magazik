import { Replace, PackageCheck, FileText, Headset } from 'lucide-react'
import { SectionHeader } from './section-header'
import { Reveal } from './reveal'

const benefits = [
  { icon: Replace, title: 'Запрос аналога', desc: 'Передайте ключевые параметры, корпус и ограничения для проверки вариантов.' },
  { icon: PackageCheck, title: 'Позиции под запрос', desc: 'Добавьте MPN и количество, даже если готовой цены пока нет в каталоге.' },
  { icon: FileText, title: 'Условия в КП', desc: 'Цена, срок и доступные документы фиксируются для конкретной заявки.' },
  { icon: Headset, title: 'Коммерческое предложение', desc: 'Корзина превращается в структурированный запрос для менеджера.' },
]

export function Benefits() {
  return (
    <section className="section-pad bg-[#f8fafc]">
      <div className="mx-auto max-w-[1400px] px-4">
        <SectionHeader
          eyebrow="Почему мы"
          title="Каталог для B2B-заявок"
          description="Соберите позиции по MPN и передайте требования одним запросом."
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
