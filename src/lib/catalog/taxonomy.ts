/**
 * Каталожная таксономия — единое дерево разделов магазина.
 *
 * Источник истины для:
 *  - построения иерархии категорий при enrichment (persistence-service)
 *  - бэкфилла существующего дерева (scripts/rebuild-category-tree)
 *  - витрины каталога и сайдбара (UI)
 *
 * Модель: 2 уровня.
 *   ROOT («Электронные компоненты») → SECTION (фикс. раздел) → leaf-категория (товарная).
 *
 * Раздел товара определяется keyword-классификатором по тексту
 * (имя категории + имя товара + корпус). Порядок правил важен:
 * более специфичные разделы идут раньше общих.
 */

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
  ж: 'zh', з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

/**
 * Стабильный slug из произвольного имени (рус. транслитерация + kebab-case).
 * Единый генератор slug для категорий во всём проекте.
 */
export function toSlug(name: string): string {
  const translit = name
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')

  return translit
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface CatalogSection {
  /** Стабильный slug раздела (используется в URL и для иконки). */
  slug: string
  /** Отображаемое имя раздела (RU). */
  name: string
  /** Ключ иконки (см. CategoryIcon) — совпадает со slug или общим ключом. */
  icon: string
  /** Короткое описание для карточки витрины. */
  blurb: string
  /** Правило классификации: товар попадает в раздел при первом совпадении. */
  match: RegExp
}

export const ROOT_SECTION = {
  slug: 'electronnye-komponenty',
  name: 'Электронные компоненты',
}

/** Slug раздела-свалки для неклассифицированных позиций. */
export const FALLBACK_SECTION_SLUG = 'prochee'

/**
 * Разделы каталога. ПОРЯДОК ВАЖЕН — классификатор берёт первое совпадение,
 * поэтому специфичные разделы (МК, датчики, питание) идут раньше общих
 * (усилители, интерфейсы), а «Прочее» — последним.
 */
export const SECTIONS: CatalogSection[] = [
  {
    slug: 'mikrokontrollery',
    name: 'Микроконтроллеры и DSP',
    icon: 'kontrollery',
    blurb: 'MCU, микропроцессоры, DSP, отладочные платы',
    match: /микроконтроллер|микропроцессор|microcontroller|\bmcu\b|\bdsp\b|digital signal processor|embedded processor|отладочн|оценочн.*микроконтроллер/i,
  },
  {
    slug: 'datchiki',
    name: 'Датчики',
    icon: 'datchiki',
    // (?<!пере) — чтобы «передатчик» не считался «датчиком»
    match: /(?<!пере)датчик|сенсор|sensor|акселерометр|accelerom|гироскоп|холл|\bhall\b|detector interface|интерфейсы датчиков/i,
    blurb: 'Температура, ускорение, Холл, положение',
  },
  {
    slug: 'atsp-tsap',
    name: 'АЦП, ЦАП и преобразователи',
    icon: 'atsp-tsap',
    blurb: 'АЦП, ЦАП, потенциометры, DDS, счётчики энергии',
    match: /ацп|цап|\badc\b|\bdac\b|analog.to.digital|digital.to.analog|потенциометр|potentiomet|\bdds\b|синтезатор.*частот|вычислительные синтезатор|преобразовател.*сигнал|signal convert|счетчик.*энерги|energy meter|v\/f|f\/v|analog front end|\bafe\b/i,
  },
  {
    slug: 'pitanie',
    name: 'Управление питанием',
    icon: 'pitanie',
    blurb: 'DC-DC, AC-DC, стабилизаторы, LDO, PMIC, ИОН',
    match: /dc.?dc|ac.?dc|off.?line|стабилизатор.*напряж|стабилизатор.*тока|\bldo\b|\bpmic\b|power management|регулятор.*напряж|voltage regulator|опорн.*напряж|источник.*опорн|ион\b|voltage reference|супервизор|supervisor|superv|мониторы питания|контроллеры.*питани|управления источниками|устройства управления источ|шим|\bpwm\b|hot.?swap|распределения питания|power distribution|load driver|rms.?dc|импульсн.*источник|switching regulator|коммутацион.*контроллер/i,
  },
  {
    slug: 'usiliteli',
    name: 'Усилители и компараторы',
    icon: 'usiliteli',
    blurb: 'ОУ, инструментальные, тока, видео, компараторы',
    match: /усилител|amplifier|\bop.?amp\b|операционн|инструментальн|instrumentation|компаратор|comparator|buffer amp|видеоусилит|audio amp|изолирующ.*усилит|считывания тока|current sense/i,
  },
  {
    slug: 'interfeysy',
    name: 'Интерфейсы и логика',
    icon: 'interfeysy',
    blurb: 'RS-232/485, изоляторы, логика, коммутаторы, тактирование',
    match: /интерфейс|interface|изолятор|изоляц|изолирующ.*драйвер|isolation|isolat|драйвер.*шин|шин данных|gate driver|драйвер.*(igbt|mosfet|затвор)|rs.?232|rs.?422|rs.?485|\busb\b|\bcan\b|\bi2c\b|\bspi\b|кодек|codec|логическ|\blogic\b|вентил|инвертор|преобразовател.*уровн|level.?shift|level translat|тактов|\bclock\b|синтезатор частот|коммутатор|switch matrix|аналоговы.*коммут|мультиплексор|multiplex|дешифратор|decoder|счетчик(?!.*энерги)/i,
  },
  {
    slug: 'rch',
    name: 'РЧ и передатчики',
    icon: 'rch',
    blurb: 'Передатчики, приёмники, РЧ-микросхемы',
    match: /передатчик|приемник|transmitter|receiver|\brf\b|радиочаст|свч|wireless|трансивер|transceiver/i,
  },
  {
    slug: 'induktivnosti',
    name: 'Индуктивности',
    icon: 'induktivnosti',
    blurb: 'Дроссели, катушки индуктивности, трансформаторы',
    match: /индуктивност|inductor|дроссель|катушк|трансформатор|transformer|феррит|ferrite/i,
  },
  {
    slug: 'kondensatory',
    name: 'Конденсаторы',
    icon: 'kondensatory',
    blurb: 'Керамические, электролитические, плёночные',
    match: /конденсатор|capacitor/i,
  },
  {
    slug: 'rezistory',
    name: 'Резисторы',
    icon: 'rezistory',
    blurb: 'Постоянные, подстроечные, сборки',
    match: /резистор|resistor/i,
  },
  {
    slug: 'optoelektronika',
    name: 'Оптоэлектроника',
    icon: 'svetodiody',
    blurb: 'Светодиоды, индикаторы, оптопары, дисплеи',
    // Раньше «диодов», иначе «светодиод» уйдёт в diody
    match: /светодиод|\bled\b|оптопар|optocoupl|оптрон|индикатор|дисплей|display|световые полос|подсветк/i,
  },
  {
    slug: 'diody',
    name: 'Диоды',
    icon: 'diody',
    blurb: 'Выпрямительные, Шоттки, стабилитроны',
    match: /диод|diode|стабилитрон|zener|шоттки|schottky|выпрямител|rectifier/i,
  },
  {
    slug: 'tranzistory',
    name: 'Транзисторы',
    icon: 'tranzistory',
    blurb: 'Биполярные, MOSFET, IGBT',
    match: /транзистор|transistor|mosfet|\bigbt\b|\bbjt\b/i,
  },
  {
    slug: 'razyomy',
    name: 'Разъёмы',
    icon: 'razyomy',
    blurb: 'Соединители, клеммы, штыревые и ВЧ',
    match: /разъ[её]м|connector|соединител|клемм|розетк|вилк|штырев|header/i,
  },
  {
    slug: 'rele-perekluchateli',
    name: 'Реле и переключатели',
    icon: 'rele',
    blurb: 'Реле, кнопки, тумблеры, переключатели',
    match: /(?<![а-яё])реле(?![а-яё])|relay|переключател|тумблер|кнопк|тактов.*кнопк/i,
  },
  {
    slug: 'zashchita',
    name: 'Защита цепей',
    icon: 'zashchita',
    blurb: 'Предохранители, варисторы, TVS-супрессоры',
    match: /предохранител|\bfuse\b|варистор|varistor|супрессор|\btvs\b|защит.*цеп|держател.*предохран|protection device/i,
  },
  {
    slug: 'rezonatory',
    name: 'Резонаторы и тактирование',
    icon: 'rezonatory',
    blurb: 'Кварцы, генераторы, RTC, фильтры',
    match: /резонатор|кварц|crystal|часы реального времени|real.?time clock|\brtc\b|фильтр.*частот/i,
  },
  {
    slug: 'mikroskhemy-prochie',
    name: 'Микросхемы прочие',
    icon: 'mikroskhemy',
    blurb: 'Видео, бытовая РЭА, спец. и сервисные ИС',
    match: /микросхем|обработк.*видео|видео.*изображен|бытов.*рэа|синтезатор.*мелод|наборы и модул|memory|память|eeprom|\bflash\b|\bpld\b|\bfpga\b/i,
  },
  // Раздел-свалка — всегда последний, ловит всё оставшееся.
  {
    slug: FALLBACK_SECTION_SLUG,
    name: 'Прочее',
    icon: 'prochee',
    blurb: 'Позиции вне основных разделов',
    match: /.*/i,
  },
]

const SECTION_BY_SLUG = new Map(SECTIONS.map((s) => [s.slug, s]))
const SECTION_BY_NAME = new Map(SECTIONS.map((s) => [s.name, s]))

export function sectionBySlug(slug: string): CatalogSection | undefined {
  return SECTION_BY_SLUG.get(slug)
}

/** true, если имя — это имя раздела верхнего уровня (а не товарной подкатегории). */
export function isSectionName(name: string | null | undefined): boolean {
  return !!name && SECTION_BY_NAME.has(name.trim())
}

/** Множество slug всех разделов (для UI/валидации). */
export const SECTION_SLUGS = new Set(SECTIONS.map((s) => s.slug))

/**
 * Классифицирует позицию в раздел каталога по набору текстов
 * (имя категории, имя товара, корпус). Возвращает slug раздела.
 * Гарантированно возвращает раздел (последний — «Прочее»).
 */
export function classifySection(...texts: Array<string | null | undefined>): string {
  const haystack = texts.filter(Boolean).join(' · ')
  if (!haystack.trim()) return FALLBACK_SECTION_SLUG
  for (const section of SECTIONS) {
    if (section.match.test(haystack)) return section.slug
  }
  return FALLBACK_SECTION_SLUG
}

/**
 * Эвристика по партномеру для крупных производителей аналоговых ИС
 * (Analog Devices, TI, Linear, Maxim). Серии MPN сильно коррелируют с типом,
 * что позволяет распределить позиции без вменяемого имени категории.
 *
 * Порядок важен: специфичные префиксы идут раньше общих (ADUM до AD,
 * ADXL до AD, и т.д.). Возвращает slug раздела или null, если префикс
 * незнаком (тогда вызывающий код падает в fallback по имени товара).
 */
const MPN_RULES: Array<[RegExp, string]> = [
  // — датчики —
  [/^ADXL|^ADT7|^TMP\d|^LM35\b|^DS18/i, 'datchiki'],
  // — изоляторы / интерфейсы / коммутаторы —
  [/^ADUM|^ADN4|^ADM(2|3|4|8)|^SN65|^SN75|^MAX(48[0-9]|232|3[0-9]{2}|13[0-9])|^ADG\d|^SN74|^74[A-Z]{2,}/i, 'interfeysy'],
  // — видео —
  [/^ADV\d/i, 'mikroskhemy-prochie'],
  // — DSP / аудио-DSP / процессоры —
  [/^ADAU|^ADSP|^SHARC|^TMS320|^BF5\d/i, 'mikrokontrollery'],
  // — РЧ —
  [/^HMC|^ADF[47]|^ADL5|^ADRF|^MAX2[0-9]{3}/i, 'rch'],
  // — компараторы (до усилителей) —
  [/^ADCMP|^LM(311|339|393|393)|^TLV3\d|^MAX9[0-9]{2}/i, 'usiliteli'],
  // — источники опорного напряжения (до питания) —
  [/^ADR\d|^REF\d|^LM4040|^LM336|^LM385|^MAX6[0-9]{3}|^TL43[12]/i, 'pitanie'],
  // — стабилизаторы / преобразователи питания —
  [/^ADP\d|^TPS\d|^TLV(6|7[01])|^LT[CM1-9]|^LTM|^LM(317|78\d|117|259\d|2596|2940|1117)|^MIC\d|^MP[0-9]{3,}|^ISL\d|^RT\d{3,}|^MP2\d|^MCP16/i, 'pitanie'],
  // — ЦАП —
  [/^DAC\d|^AD5\d|^AD3\d|^LTC2[6-9]|^MAX5[0-9]{3}/i, 'atsp-tsap'],
  // — АЦП —
  [/^ADC\d|^AD7\d|^AD9\d|^AD6\d|^AD4[0-9]{2}|^ADS\d|^MAX1[01][0-9]{2}|^MCP3/i, 'atsp-tsap'],
  // — защита —
  [/^PESD|^SMAJ|^SMBJ|^SMF\d|^ESDA|^TVS/i, 'zashchita'],
  // — усилители / ОУ (общая серия, последняя) —
  [/^OP\d|^AD8\d|^ADA4|^AD4[0-9]{2}|^LT1[0-9]{3}|^LM358|^LM324|^LM741|^TL07|^TL08|^NE55|^MCP6|^OPA\d/i, 'usiliteli'],
]

export function classifyByMpn(mpn: string | null | undefined): string | null {
  if (!mpn) return null
  const m = mpn.trim()
  for (const [re, section] of MPN_RULES) {
    if (re.test(m)) return section
  }
  return null
}

/**
 * Единая точка классификации товара в раздел каталога.
 *
 *  - если есть осмысленное имя категории — раздел определяется по нему
 *    (+ хлебные крошки), БЕЗ имени товара, чтобы одна листовая категория
 *    всегда попадала в один и тот же раздел;
 *  - иначе (категория — мусор/пусто) — по эвристике партномера, затем по
 *    имени товара и корпусу.
 */
export function classifyProduct(input: {
  categoryPath?: string[] | null
  categoryName?: string | null
  productName?: string | null
  mpn?: string | null
  package?: string | null
}): string {
  const { categoryPath, categoryName, productName, mpn, pkg } = {
    ...input,
    pkg: input.package,
  }

  // Имя категории уже совпадает с разделом верхнего уровня — берём его.
  const section = categoryName ? SECTION_BY_NAME.get(categoryName.trim()) : undefined
  if (section) return section.slug

  if (categoryName && !isJunkLeafName(categoryName)) {
    return classifySection(...(categoryPath ?? []), categoryName)
  }

  // нет вменяемой категории — пробуем по MPN, затем по имени/корпусу
  return classifyByMpn(mpn) ?? classifySection(productName, pkg, categoryName)
}

/**
 * Имена «категорий», которые на деле являются мусором (бренд, статус заказа,
 * заглушка) и не должны быть товарными подкатегориями. Такие позиции
 * крепятся напрямую к разделу.
 */
const JUNK_LEAF = /^(analog devices|texas instruments|stmicro|без категории|uncategorized|позиции на заказ|products? to order|под заказ|прочее|other|n\/a|—|-)\s*$/i

export function isJunkLeafName(name: string | null | undefined): boolean {
  if (!name) return true
  // имя раздела верхнего уровня не должно становиться товарной подкатегорией
  if (isSectionName(name)) return true
  return JUNK_LEAF.test(name.trim())
}

/**
 * Нормализует имя листовой категории к единому русскому виду:
 *  - схлопывает известные английские категории LCSC/Mouser в русские эквиваленты
 *  - чистит хвостовые «...» и лишние пробелы
 * Используется при бэкфилле для слияния дубликатов и устранения англоязычных
 * названий разделов.
 */
const EN_RU_LEAF: Array<[RegExp, string]> = [
  [/instrumentation.*op amps|op amps.*buffer|instrumentation amplifier/i, 'Усилители – Инструментальные'],
  [/linear comparators?|^comparators?/i, 'Компараторы'],
  [/video amps|video amplifier/i, 'Видеоусилители'],
  [/audio amplifier/i, 'Усилители низкой частоты'],
  [/special purpose amplifier/i, 'Усилители прочие'],
  [/sensor and detector interface/i, 'Интерфейсы датчиков и детекторов'],
  [/operational amplifier/i, 'Операционные усилители'],
  [/low drop out|ldo regulator|linear.*regulator/i, 'Стабилизаторы напряжения и тока'],
  [/dc dc switching regulator|switching regulator/i, 'DC-DC Преобразователи'],
  [/voltage reference/i, 'Источники опорного напряжения ИОН'],
  [/hot swap controller/i, 'Контроллеры и мониторы питания'],
  [/power distribution switch|load driver/i, 'Переключатели распределения питания'],
  [/^supervisors?\b|supervisory circuit/i, 'Супервизоры'],
  [/signal isolation/i, 'Драйверы изоляторов шин данных'],
  [/digital signal processor|^dsp\b/i, 'Цифровые сигнальные процессоры (DSP)'],
]

export function normalizeLeafName(name: string): string {
  const cleaned = name.replace(/\s*\.{2,}\s*$/g, '').replace(/\s+/g, ' ').trim()
  for (const [re, ru] of EN_RU_LEAF) {
    if (re.test(cleaned)) return ru
  }
  return cleaned
}
