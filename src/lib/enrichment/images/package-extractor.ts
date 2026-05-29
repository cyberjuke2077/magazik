import {
  MPN_PACKAGE_DESIGNATORS,
  PACKAGE_PATTERNS,
  type PackageFamily,
} from '../constants/package-families'

/**
 * Извлекает семейство корпуса для товара, чтобы выбрать generic-SVG,
 * когда у товара нет реального фото.
 *
 * Каскад источников (от надёжного к эвристическому):
 *   1. rawPackage — строка корпуса из источника (LCSC даёт "SOIC-8",
 *      "LFCSP-8(3x3)" и т.п.). Самый надёжный сигнал.
 *   2. Явное упоминание корпуса в partNumber или name (PACKAGE_PATTERNS).
 *   3. Буквенный package-designator в конце MPN (TI/ADI/Linear).
 *
 * @returns канон. семейство (PackageFamily) или null, если не распознано.
 *
 * @example
 * extractPackageFamily('SOIC-8', 'LM358DR', 'Op-amp')  // → 'soic'
 * extractPackageFamily(null, 'TPS2069CDBVR', '')        // → 'sot23'  (designator DBV)
 * extractPackageFamily(null, 'DAC8554IPWR', '')         // → 'tssop'  (designator PW)
 * extractPackageFamily(null, 'STM32F407VGT6', '')       // → 'qfp'    (Tx → LQFP не ловим, но "VGT6"→? см. ниже)
 * extractPackageFamily(null, 'СП3-19А', 'резистор')     // → null
 */
export function extractPackageFamily(
  rawPackage: string | null | undefined,
  partNumber: string,
  name?: string | null,
): PackageFamily | null {
  // 1. Явный package из источника — пробуем по паттернам.
  if (rawPackage) {
    const fromPkg = matchPattern(rawPackage.toUpperCase())
    if (fromPkg) return fromPkg
  }

  // 2. Явное упоминание в partNumber / name.
  const text = [partNumber, name].filter(Boolean).join(' ').toUpperCase()
  const fromText = matchPattern(text)
  if (fromText) return fromText

  // 3. Package-designator в конце MPN.
  const fromDesignator = matchDesignator(partNumber)
  if (fromDesignator) return fromDesignator

  return null
}

/** Прогоняет строку через PACKAGE_PATTERNS, возвращает первое совпадение. */
function matchPattern(upper: string): PackageFamily | null {
  for (const { family, re } of PACKAGE_PATTERNS) {
    if (re.test(upper)) return family
  }
  return null
}

/**
 * Удаляет хвостовые reel/tape/quality/option-суффиксы, чтобы обнажить
 * package-designator. Чистит итеративно, т.к. хвосты комбинируются:
 *   "#TRPBF" (Linear quality), "-REEL7"/"-R7"/"/TR" (reel), "-1"/"-3.3"
 *   (опции напряжения), "G4"/"E3" (TI/lead-free), хвостовой "R"/"T" (reel).
 *
 * RoHS-суффикс ADI "Z" НЕ снимается — Z-варианты кодов (CPZ/RUZ/RMZ)
 * перечислены в MPN_PACKAGE_DESIGNATORS явно.
 */
function stripTrailingNoise(mpn: string): string {
  let s = mpn.toUpperCase().trim()
  // Linear/ADI «#»-варианты: всё после # — упаковка/качество.
  s = s.replace(/#.*$/, '')

  let prev: string
  do {
    prev = s
    // reel/tape/quality токены с разделителем
    s = s.replace(/[-/](REEL7?|RL7?|R7|TR|T7|TRPBF|PBF|G4|E4|E3|TAPE)$/, '')
    // опции через дефис: -1, -2, -3.3, -04, -2.5
    s = s.replace(/[-/][0-9.]+$/, '')
    // повисшие разделители
    s = s.replace(/[-/.\s]+$/, '')
  } while (s !== prev)

  // Хвостовой одиночный reel-символ без разделителя (TI: ...DBVR, ...PWR).
  s = s.replace(/[RT]$/, '')
  return s
}

/**
 * Ищет package-designator в конце нормализованного MPN.
 *
 * Учитывает две структуры MPN:
 *   - TI/ADI: `<номер><grade?><КОД>` — код в самом конце.
 *   - Linear: `<номер><grade><КОД><pins>` — после кода идёт pin-count,
 *     поэтому допускаем 0–3 цифры после кода (regex `КОД\d{0,3}$`).
 *
 * Длинные коды проверяются раньше коротких (greedy). Для одно-/двух-
 * буквенных кодов требуем: перед кодом есть содержимое длиной ≥ 4 и
 * во всём префиксе есть хотя бы одна цифра — это отсекает совпадения
 * на обычных окончаниях слов (например 'ABCD' → не 'D'/SOIC).
 */
function matchDesignator(partNumber: string): PackageFamily | null {
  const core = stripTrailingNoise(partNumber)
  if (!core) return null

  const sorted = [...MPN_PACKAGE_DESIGNATORS].sort((a, b) => b.code.length - a.code.length)

  for (const { code, family } of sorted) {
    const re = new RegExp(`${code}\\d{0,3}$`)
    const m = re.exec(core)
    if (!m) continue
    const prefix = core.slice(0, m.index)
    if (!/[0-9]/.test(prefix)) continue // должен быть реальный партномер
    if (code.length <= 2 && prefix.length < 4) continue // защита от мусора
    return family
  }
  return null
}
