import Link from 'next/link'
import { ListChecks, Calculator, FileSignature, Truck, ArrowRight } from 'lucide-react'
import { Reveal } from './reveal'

const steps = [
  { icon: ListChecks, title: 'Заявка или список', desc: 'Пришлите спецификацию или соберите позиции в корзину-запрос.' },
  { icon: Calculator, title: 'Подбор и расчёт', desc: 'Проверим наличие, предложим аналоги и сформируем КП с ценами.' },
  { icon: FileSignature, title: 'Договор и оплата', desc: 'Согласуем условия, работаем по безналу с НДС и договором.' },
  { icon: Truck, title: 'Поставка и документы', desc: 'Отгружаем со склада и передаём полный пакет документов.' },
]

export function Workflow() {
  return (
    <section className="section-pad bg-ink text-white">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="ui-eyebrow mb-3 text-azure-light">Как мы работаем</div>
            <h2 className="section-heading text-white">От заявки до поставки — 4 шага</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/70">
              Прозрачный процесс без лишней бюрократии: вы получаете расчёт, сроки и документы.
            </p>
          </div>
          <Link
            href="/request-quote"
            className="ui-btn ui-btn-lg shrink-0 bg-white text-ink hover:bg-white/90 group"
          >
            Запросить КП
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={(i % 4) * 80} as="div">
              <li className="relative h-full rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-azure text-white">
                    <s.icon size={24} strokeWidth={1.8} />
                  </span>
                  <span className="price text-3xl text-white/15">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
