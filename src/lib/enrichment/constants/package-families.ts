/**
 * Семейства корпусов и правила их распознавания.
 *
 * Используется package-extractor'ом для приведения сырых строк
 * (package из источника, partNumber, name) к ограниченному набору
 * семейств, под каждое из которых есть generic-SVG в public/packages/.
 *
 * Два механизма распознавания:
 *   1. PACKAGE_PATTERNS — явное упоминание корпуса в тексте
 *      (например "SOIC-8", "SOT-23-5", "0805").
 *   2. MPN_PACKAGE_DESIGNATORS — буквенный код корпуса в конце MPN,
 *      используемый TI/ADI/Linear (например ...DBVR → SOT-23-5,
 *      ...PWR → TSSOP, ...DR → SOIC). Это даёт корпус там, где
 *      текстового упоминания нет.
 */

/**
 * Канонические семейства корпусов. КАЖДОЕ значение должно иметь
 * соответствующий generic-SVG в public/packages/<family>.svg
 * (см. packageImageUrl). Значение строки = имя файла без расширения.
 */
export const PACKAGE_FAMILIES = [
  'soic',
  'msop',
  'tssop',
  'sot23',
  'sc70',
  'qfn',
  'qfp',
  'dip',
  'to220',
  'to252',
  'to263',
  'to92',
  'sod',
  'bga',
  'chip', // 0402/0603/0805/1206 — двухвыводные SMD (резисторы/конденсаторы/диоды)
] as const

export type PackageFamily = (typeof PACKAGE_FAMILIES)[number]

/**
 * Регэкспы распознавания семейства по явному тексту корпуса.
 * Порядок ВАЖЕН: специфичные раньше общих (SOT-223 раньше SOT-23,
 * TSSOP раньше SOP). Применяются к uppercase-строке.
 */
export const PACKAGE_PATTERNS: ReadonlyArray<{ family: PackageFamily; re: RegExp }> = [
  // SOT-семейство (порядок: spec → общий)
  { family: 'to252', re: /\bSOT-?223\b/ }, // SOT-223 ≈ DPAK по виду; в to252 (tab-mount)
  { family: 'sc70', re: /\bSC-?70\b|\bSOT-?323\b|\bSOT-?353\b|\bSOT-?363\b/ },
  { family: 'sot23', re: /\b(T|S)?SOT-?23(-?\d)?\b|\bSOT-?23\b/ },
  // Корпуса с крылышками (gull-wing)
  { family: 'tssop', re: /\bH?TSSOP-?\d*\b|\bHTSSOP\b/ },
  { family: 'msop', re: /\b(V|H)?MSOP-?\d*\b/ },
  { family: 'soic', re: /\bSOIC-?\d*|\bSO-?\d+\b|\bSOP-?\d+\b|\bSOIC\b/ },
  // Корпуса без выводов / с термопадом
  { family: 'qfn', re: /\b(V|W|U|H)?QFN-?\d*|\b[WVUH]?DFN-?\d*|\bLFCSP-?\d*|\bWSON\b|\bUSON\b/ },
  { family: 'qfp', re: /\b(L|T|H|M)?QFP-?\d*/ },
  { family: 'bga', re: /\b(C|F|T|U|W|V)?BGA-?\d*|\bWLCSP-?\d*/ },
  // Through-hole / power
  { family: 'to263', re: /\bTO-?263\b|\bD2?PAK\b|\bDDPAK\b/ },
  { family: 'to252', re: /\bTO-?252\b|\bDPAK\b/ },
  { family: 'to220', re: /\bTO-?220\b/ },
  { family: 'to92', re: /\bTO-?92\b/ },
  { family: 'dip', re: /\b(C|P)?DIP-?\d*|\bDIP\d+\b|\bPDIP\b/ },
  { family: 'sod', re: /\bSOD-?\d+|\bSM[ABC]\b|\bDO-?\d+\b/ },
  // Двухвыводные SMD по типоразмеру
  { family: 'chip', re: /\b(0201|0402|0603|0805|1206|1210|2010|2512)\b/ },
]

/**
 * Буквенные коды корпуса в КОНЦЕ MPN (после нормализации reel-суффиксов).
 * Преимущественно TI / Analog Devices / Linear. Ключ — суффикс,
 * проверяемый как окончание MPN; значение — семейство.
 *
 * Отсортировано в коде (длинные раньше коротких) при матчинге, поэтому
 * порядок объявления здесь не критичен.
 *
 * Примеры:
 *   TPS54331DDAR  → DDA → soic(HSOIC) → soic
 *   TLV70033DCKR  → DCK → SC-70
 *   TPS2069CDBVR  → DBV → SOT-23-5
 *   DAC8554IPWR   → PW  → TSSOP
 *   SN65HVD82DR   → D   → SOIC
 *   ADXL337BCPZ   → CP  → LFCSP(QFN)
 */
export const MPN_PACKAGE_DESIGNATORS: ReadonlyArray<{ code: string; family: PackageFamily }> = [
  // SOT-23 (TI: DBV=5pin, DCK=SC70, DBZ=SOT23-3, DRL=SOT553)
  { code: 'DBV', family: 'sot23' },
  { code: 'DBZ', family: 'sot23' },
  { code: 'DCK', family: 'sc70' },
  { code: 'DCK', family: 'sc70' },
  { code: 'DRL', family: 'sot23' },
  { code: 'DDC', family: 'sot23' }, // SOT-23-6 thin
  // TSSOP (TI: PW), также ADI RU = TSSOP
  { code: 'PWR', family: 'tssop' },
  { code: 'PW', family: 'tssop' },
  { code: 'RU', family: 'tssop' }, // ADI: TSSOP
  { code: 'RUZ', family: 'tssop' },
  // QSOP / SSOP (ADI: RQ = QSOP)
  { code: 'RQ', family: 'tssop' }, // ADI QSOP ≈ узкий SSOP, визуально близко к TSSOP
  { code: 'RQZ', family: 'tssop' },
  // MSOP (TI: DGK), ADI RM = MSOP
  { code: 'DGK', family: 'msop' },
  { code: 'DGS', family: 'msop' },
  { code: 'RM', family: 'msop' }, // ADI: MSOP
  { code: 'RMZ', family: 'msop' },
  { code: 'MS', family: 'msop' }, // Linear: MSOP
  // SOIC / SO (TI: D, DR; HSOIC: DDA, DW=wide)
  { code: 'DDA', family: 'soic' },
  { code: 'DWR', family: 'soic' },
  { code: 'DW', family: 'soic' },
  { code: 'NSR', family: 'soic' }, // SO-8 PowerPAD variants
  { code: 'D', family: 'soic' },
  { code: 'S', family: 'soic' }, // Linear: SO-8 (e.g. LTC...CS8)
  // Power Integrations: DN/GN = SMD-8C/PDIP-8 (LinkSwitch и т.п.)
  { code: 'DN', family: 'soic' },
  { code: 'GN', family: 'soic' },
  // QFN / LFCSP (TI: RGE/RGT/RHB/RTE/RGZ; ADI: CP=LFCSP; WSON: DRB/DSC)
  { code: 'RGE', family: 'qfn' },
  { code: 'RGT', family: 'qfn' },
  { code: 'RGZ', family: 'qfn' },
  { code: 'RHB', family: 'qfn' },
  { code: 'RTE', family: 'qfn' },
  { code: 'RTER', family: 'qfn' },
  { code: 'DRB', family: 'qfn' },
  { code: 'DRC', family: 'qfn' },
  { code: 'CP', family: 'qfn' }, // ADI: LFCSP
  { code: 'CPZ', family: 'qfn' },
  // SC-70 / SOT-353 (TI: DCK уже выше)
  // TO-220 / TO-263 (TI: KC/KV=TO-220, KTT=TO-263, KVU=TO-263)
  { code: 'KC', family: 'to220' },
  { code: 'KV', family: 'to220' },
  { code: 'KTT', family: 'to263' },
  { code: 'KVU', family: 'to263' },
  // BGA / WLCSP (TI: YZ/YFF/YEZ/ZQZ; ADI: BC=WLCSP)
  { code: 'YZ', family: 'bga' },
  { code: 'YFF', family: 'bga' },
  { code: 'YEZ', family: 'bga' },
  { code: 'ZQZ', family: 'bga' },
  { code: 'BC', family: 'bga' }, // ADI: WLCSP (e.g. ADP196ACBZ → CB? handled by pattern too)
]
