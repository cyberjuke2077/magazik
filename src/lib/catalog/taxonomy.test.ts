import { describe, it, expect } from 'vitest'
import {
  classifySection,
  classifyByMpn,
  classifyProduct,
  toSlug,
  normalizeLeafName,
  isJunkLeafName,
  isSectionName,
  sectionBySlug,
  SECTIONS,
  FALLBACK_SECTION_SLUG,
} from './taxonomy'

describe('toSlug', () => {
  it('transliterates Russian and kebab-cases', () => {
    expect(toSlug('Микроконтроллеры')).toBe('mikrokontrollery')
    expect(toSlug('АЦП, ЦАП и преобразователи')).toBe('atsp-tsap-i-preobrazovateli')
    expect(toSlug('DC-DC Преобразователи')).toBe('dc-dc-preobrazovateli')
  })
  it('strips edge dashes and collapses repeats', () => {
    expect(toSlug('  — Усилители —  ')).toBe('usiliteli')
  })
})

describe('classifySection', () => {
  const cases: Array<[string, string]> = [
    ['Микроконтроллеры', 'mikrokontrollery'],
    ['Цифровые сигнальные процессоры (DSP)', 'mikrokontrollery'],
    ['Датчики температуры', 'datchiki'],
    ['Датчики ускорения (акселерометры)', 'datchiki'],
    // регрессия: «передатчик» не должен считаться «датчиком»
    ['Передатчики', 'rch'],
    ['Микросхемы АЦП', 'atsp-tsap'],
    ['Микросхемы ЦАП', 'atsp-tsap'],
    ['Цифровые потенциометры', 'atsp-tsap'],
    ['Цифровые вычислительные синтезаторы (DDS)', 'atsp-tsap'],
    ['DC-DC Преобразователи', 'pitanie'],
    ['AC-DC Преобразователи, Off-Line коммутаторы', 'pitanie'],
    ['Стабилизаторы напряжения и тока', 'pitanie'],
    ['Источники опорного напряжения ИОН', 'pitanie'],
    ['ШИМ-контроллеры', 'pitanie'],
    ['Супервизоры', 'pitanie'],
    ['Усилители – Инструментальные', 'usiliteli'],
    ['Компараторы', 'usiliteli'],
    ['Операционный усилитель', 'usiliteli'],
    ['Драйверы изоляторов шин данных', 'interfeysy'],
    ['Аналоговые коммутаторы', 'interfeysy'],
    ['Интерфейсы RS-232', 'interfeysy'],
    ['Логические - Преобразователи уровня', 'interfeysy'],
    ['Индуктивности выводные', 'induktivnosti'],
    // регрессия: «светодиод» → оптоэлектроника, не диоды
    ['Светодиоды круглые', 'optoelektronika'],
    ['Кварцевые резонаторы', 'rezonatory'],
    ['Часы реального времени', 'rezonatory'],
    ['Высокочастотные разъемы', 'razyomy'],
    ['Держатели предохранителей', 'zashchita'],
    ['Микросхемы прочие', 'mikroskhemy-prochie'],
    ['Без категории', 'prochee'],
    ['Позиции на заказ', 'prochee'],
  ]

  for (const [name, expected] of cases) {
    it(`classifies "${name}" → ${expected}`, () => {
      expect(classifySection(name)).toBe(expected)
    })
  }

  it('uses full context (path + name)', () => {
    expect(classifySection('Электронные компоненты', 'Микроконтроллеры', 'STM32F103')).toBe('mikrokontrollery')
  })

  it('falls back to prochee for empty/unknown input', () => {
    expect(classifySection()).toBe(FALLBACK_SECTION_SLUG)
    expect(classifySection('', null, undefined)).toBe(FALLBACK_SECTION_SLUG)
    expect(classifySection('абвгд непонятно')).toBe(FALLBACK_SECTION_SLUG)
  })

  it('every section slug resolves', () => {
    for (const s of SECTIONS) {
      expect(sectionBySlug(s.slug)).toBeDefined()
    }
  })
})

describe('isJunkLeafName', () => {
  it('flags brand/status/placeholder names as junk', () => {
    expect(isJunkLeafName('Без категории')).toBe(true)
    expect(isJunkLeafName('Analog Devices')).toBe(true)
    expect(isJunkLeafName('Позиции на заказ')).toBe(true)
    expect(isJunkLeafName('Products to order')).toBe(true)
    expect(isJunkLeafName(null)).toBe(true)
  })
  it('keeps real leaf names', () => {
    expect(isJunkLeafName('Усилители – Инструментальные')).toBe(false)
    expect(isJunkLeafName('DC-DC Преобразователи')).toBe(false)
  })
})

describe('normalizeLeafName', () => {
  it('maps known English LCSC/Mouser categories to Russian', () => {
    expect(normalizeLeafName('Amplifiers/Comparators/Instrumentation, Op Amps, Buffer Amps'))
      .toBe('Усилители – Инструментальные')
    expect(normalizeLeafName('Power Management (PMIC)/Voltage Reference'))
      .toBe('Источники опорного напряжения ИОН')
  })
  it('trims trailing ellipsis and whitespace', () => {
    expect(normalizeLeafName('Операционный усилитель ...')).toBe('Операционный усилитель')
  })
  it('leaves unknown Russian names intact', () => {
    expect(normalizeLeafName('Индуктивности выводные')).toBe('Индуктивности выводные')
  })
})

describe('classifyByMpn', () => {
  const cases: Array<[string, string]> = [
    ['AD8221ARZ', 'usiliteli'],   // инструментальный усилитель
    ['ADA4807-4ARUZ', 'usiliteli'],
    ['OP200GSZ', 'usiliteli'],
    ['AD5446YRMZ', 'atsp-tsap'],  // ЦАП
    ['DAC8554IPWR', 'atsp-tsap'],
    ['AD7124-8BCPZ', 'atsp-tsap'], // АЦП
    ['ADUM121N0BRZ', 'interfeysy'], // цифровой изолятор
    ['SN65HVD82DR', 'interfeysy'],  // RS-485 трансивер
    ['ADG1212YRUZ', 'interfeysy'],  // аналоговый ключ
    ['ADXL337BCPZ', 'datchiki'],    // акселерометр
    ['ADP7142AUJZ', 'pitanie'],     // LDO
    ['TPS54331DDAR', 'pitanie'],
    ['LT3471EDD', 'pitanie'],
    ['ADR03BUJZ', 'pitanie'],       // источник опорного напряжения
    ['PESD5V0S1BL', 'zashchita'],
    ['ADV7123KSTZ50', 'mikroskhemy-prochie'], // видео-ЦАП
  ]
  for (const [mpn, expected] of cases) {
    it(`${mpn} → ${expected}`, () => {
      expect(classifyByMpn(mpn)).toBe(expected)
    })
  }
  it('returns null for unknown prefixes', () => {
    expect(classifyByMpn('XYZ999')).toBeNull()
    expect(classifyByMpn(null)).toBeNull()
  })
})

describe('classifyProduct', () => {
  it('prefers a meaningful category name over MPN', () => {
    // имя категории «Передатчики» → РЧ, несмотря на MPN усилителя
    expect(classifyProduct({ categoryName: 'Передатчики', productName: 'AD8132', mpn: 'AD8132' })).toBe('rch')
  })
  it('falls back to MPN heuristic when category is junk', () => {
    expect(classifyProduct({ categoryName: 'Без категории', mpn: 'AD5446YRMZ' })).toBe('atsp-tsap')
  })
  it('is idempotent: a section name maps back to its section', () => {
    // ключевое свойство для повторных прогонов backfill
    for (const s of SECTIONS) {
      expect(classifyProduct({ categoryName: s.name })).toBe(s.slug)
      expect(isJunkLeafName(s.name)).toBe(true)
      expect(isSectionName(s.name)).toBe(true)
    }
  })
})
