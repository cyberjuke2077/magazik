'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SectionHeader } from './section-header'

const faqs = [
  {
    q: 'Вы работаете с юридическими лицами?',
    a: 'Да, это наш основной формат. Работаем по безналичному расчёту с НДС, заключаем договор и предоставляем полный пакет закрывающих документов.',
  },
  {
    q: 'Что делать, если нужной позиции нет в наличии?',
    a: 'Привозим под заказ. Пришлите список — проверим доступность у поставщиков, согласуем сроки и стоимость до оформления.',
  },
  {
    q: 'Поможете подобрать аналог?',
    a: 'Да. Подберём замену по ключевым параметрам, корпусу и бюджету с учётом текущей доступности на складах.',
  },
  {
    q: 'Как получить коммерческое предложение?',
    a: 'Соберите позиции в корзину или отправьте свою спецификацию при оформлении. Сформируем расчёт с ценами и сроками.',
  },
  {
    q: 'Как происходит доставка?',
    a: 'Отгружаем со склада в Москве по всей России удобной транспортной компанией. Сроки и способ согласуем при оформлении заявки.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="section-pad bg-[#f8fafc]">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeader eyebrow="Вопросы и ответы" title="Частые вопросы" align="center" />

        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-white">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[#f8fafc]"
                >
                  <span className="text-base font-bold text-ink md:text-lg">{item.q}</span>
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-azure-light text-azure transition-transform duration-300 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    <Plus size={18} />
                  </span>
                </button>
                <div className="ui-accordion-panel px-6" data-open={isOpen}>
                  <div>
                    <p className="pb-5 text-[15px] leading-relaxed text-ink-3">{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
