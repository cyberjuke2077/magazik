'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SectionHeader } from './section-header'

const faqs = [
  {
    q: 'Вы работаете с юридическими лицами?',
    a: 'Да, каталог и форма заявки ориентированы на компании и ИП. Условия оплаты и комплект документов указываются в КП или договоре.',
  },
  {
    q: 'Что делать, если нужной позиции нет в наличии?',
    a: 'Пришлите MPN и количество. Возможность поставки, цену и срок подтвердим в коммерческом предложении.',
  },
  {
    q: 'Поможете подобрать аналог?',
    a: 'Передайте ключевые параметры, корпус и ограничения. Возможность подбора подтвердим после рассмотрения запроса.',
  },
  {
    q: 'Как получить коммерческое предложение?',
    a: 'Соберите позиции в корзину или укажите свою спецификацию при оформлении заявки.',
  },
  {
    q: 'Как происходит доставка?',
    a: 'Способ, стоимость, адрес и срок поставки согласуются для конкретной заявки и фиксируются в КП или договоре.',
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
