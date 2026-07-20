/**
 * Единый источник реквизитов компании.
 *
 * ВНИМАНИЕ: значения с пометкой [ЗАПОЛНИТЬ] — плейсхолдеры.
 * Заменить реальными данными ДО выкатки в прод (юр-корректность: ФЗ-152, оферта).
 * После заполнения проверить, что hasPlaceholders() === false.
 *
 * Менять реквизиты только здесь — по сайту они подтягиваются отсюда,
 * хардкодить телефон/email/ИНН в компонентах нельзя.
 */

const PLACEHOLDER = '[ЗАПОЛНИТЬ]'

export const COMPANY = {
  /** Организационно-правовая форма */
  legalForm: 'ООО',
  /** Полное юр. наименование, напр. ООО «Электромагаз» */
  legalName: 'ООО «Электромагаз»',
  /** Короткое имя для интерфейса */
  shortName: 'Электромагаз',
  /** Бренд (написание в шапке/футере) */
  brand: 'ELECTROMAGAZ',

  /** ИНН — [ЗАПОЛНИТЬ] */
  inn: PLACEHOLDER,
  /** КПП — [ЗАПОЛНИТЬ] */
  kpp: PLACEHOLDER,
  /** ОГРН — [ЗАПОЛНИТЬ] */
  ogrn: PLACEHOLDER,
  /** Юридический адрес — [ЗАПОЛНИТЬ] */
  legalAddress: 'г. Москва',

  /** Год основания (используется в текстах «на рынке с …») */
  foundedYear: 2012,

  phone: {
    /** Для tel: и JSON-LD, только цифры с + — [ЗАПОЛНИТЬ] */
    raw: '+78005553535',
    /** Отображаемый формат — [ЗАПОЛНИТЬ] */
    display: '+7 (800) 555-35-35',
  },

  /** Основной email — [ЗАПОЛНИТЬ] */
  email: 'info@electromagaz.ru',
  /** Email техподдержки — [ЗАПОЛНИТЬ] */
  supportEmail: 'support@electromagaz.ru',
  /** Email отдела продаж */
  salesEmail: 'sales@electromagaz.ru',
  /** Email бухгалтерии */
  accountingEmail: 'accounting@electromagaz.ru',
  /** Email для вакансий */
  hrEmail: 'hr@electromagaz.ru',

  messengers: {
    telegram: 'https://t.me/electromagaz',
  },

  /** Город для коротких упоминаний */
  city: 'Москва',

  /** Банковские реквизиты для безналичной оплаты (B2B) */
  bank: {
    name: PLACEHOLDER,
    bic: PLACEHOLDER,
    /** Расчётный счёт */
    account: PLACEHOLDER,
    /** Корреспондентский счёт */
    corrAccount: PLACEHOLDER,
  },
} as const

/** true, если в реквизитах остались незаполненные плейсхолдеры. */
export function hasPlaceholders(): boolean {
  return JSON.stringify(COMPANY).includes(PLACEHOLDER)
}

/** Адрес сайта (для оферты, JSON-LD, ссылок). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://electromagaz.ru'
