/**
 * Генератор generic-SVG корпусов в public/packages/.
 *
 * Один источник истины для всех семейств: единый стиль (azure-тема
 * проекта, #0066cc на #e8f4ff), узнаваемый технический силуэт корпуса +
 * подпись семейства. Запускается один раз; результат коммитится как
 * статические ассеты. Регенерация идемпотентна.
 *
 * Семейства синхронизированы с PACKAGE_FAMILIES
 * (src/lib/enrichment/constants/package-families.ts).
 *
 * Usage: npm exec tsx -- scripts/gen-package-svgs.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT = resolve(process.cwd(), 'public', 'packages')

const BG = '#e8f4ff'
const BODY = '#1a3a5c' // тело корпуса (тёмно-синий — «пластик чипа»)
const PIN = '#7a8fa6' // выводы (металл)
const ACCENT = '#0066cc'
const LABEL = '#0066cc'
const SIZE = 400
const CX = SIZE / 2

function svg(label: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  <g>
${body}
  </g>
  <text x="${CX}" y="350" text-anchor="middle" fill="${LABEL}" font-family="system-ui, sans-serif" font-size="26" font-weight="600">${label}</text>
</svg>
`
}

function rect(x: number, y: number, w: number, h: number, fill: string, extra = ''): string {
  return `    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`
}

/** Корпус с gull-wing ногами по левой и правой сторонам (SOIC/MSOP/TSSOP/SOP). */
function gullWing(label: string, pinsPerSide: number, bodyW: number): string {
  const bodyH = 150
  const top = 130
  const bodyX = CX - bodyW / 2
  const parts: string[] = []
  // ноги
  const pinH = 10
  const pinW = 26
  const gap = bodyH / pinsPerSide
  for (let i = 0; i < pinsPerSide; i++) {
    const y = top + gap * i + gap / 2 - pinH / 2
    parts.push(rect(bodyX - pinW, y, pinW, pinH, PIN, 'rx="2"'))
    parts.push(rect(bodyX + bodyW, y, pinW, pinH, PIN, 'rx="2"'))
  }
  // тело
  parts.push(rect(bodyX, top, bodyW, bodyH, BODY, 'rx="8"'))
  // pin-1 маркер
  parts.push(`    <circle cx="${bodyX + 22}" cy="${top + 26}" r="9" fill="${ACCENT}"/>`)
  return parts.join('\n')
}

/** Малый корпус с ногами вниз (SOT-23 / SC-70). */
function smallOutline(label: string, pins: number): string {
  const bodyW = 150
  const bodyH = 90
  const top = 150
  const bodyX = CX - bodyW / 2
  const parts: string[] = []
  const botPins = Math.ceil(pins / 2)
  const topPins = pins - botPins
  const pinW = 18
  const pinH = 30
  const place = (count: number, y: number) => {
    if (count === 0) return
    const step = bodyW / count
    for (let i = 0; i < count; i++) {
      const x = bodyX + step * i + step / 2 - pinW / 2
      parts.push(rect(x, y, pinW, pinH, PIN, 'rx="2"'))
    }
  }
  place(botPins, top + bodyH)
  place(topPins, top - pinH)
  parts.push(rect(bodyX, top, bodyW, bodyH, BODY, 'rx="6"'))
  parts.push(`    <circle cx="${bodyX + 20}" cy="${top + 20}" r="7" fill="${ACCENT}"/>`)
  return parts.join('\n')
}

/** Квадрат с ногами по четырём сторонам (QFP). */
function quadFlat(label: string, perSide: number): string {
  const body = 170
  const x0 = CX - body / 2
  const y0 = 110
  const parts: string[] = []
  const pinLen = 22
  const pinT = 8
  const step = body / perSide
  for (let i = 0; i < perSide; i++) {
    const off = step * i + step / 2 - pinT / 2
    parts.push(rect(x0 - pinLen, y0 + off, pinLen, pinT, PIN, 'rx="1"')) // left
    parts.push(rect(x0 + body, y0 + off, pinLen, pinT, PIN, 'rx="1"')) // right
    parts.push(rect(x0 + off, y0 - pinLen, pinT, pinLen, PIN, 'rx="1"')) // top
    parts.push(rect(x0 + off, y0 + body, pinT, pinLen, PIN, 'rx="1"')) // bottom
  }
  parts.push(rect(x0, y0, body, body, BODY, 'rx="10"'))
  parts.push(`    <circle cx="${x0 + 26}" cy="${y0 + 26}" r="9" fill="${ACCENT}"/>`)
  return parts.join('\n')
}

/** Квадрат с контактами-площадками по периметру (QFN/DFN/LFCSP, без ног). */
function quadNoLead(label: string, perSide: number): string {
  const body = 180
  const x0 = CX - body / 2
  const y0 = 105
  const parts: string[] = [rect(x0, y0, body, body, BODY, 'rx="12"')]
  const padW = 14
  const padH = 9
  const step = body / perSide
  for (let i = 0; i < perSide; i++) {
    const off = step * i + step / 2
    parts.push(rect(x0 + 4, y0 + off - padH / 2, padW, padH, PIN, 'rx="2"'))
    parts.push(rect(x0 + body - 4 - padW, y0 + off - padH / 2, padW, padH, PIN, 'rx="2"'))
    parts.push(rect(x0 + off - padH / 2, y0 + 4, padH, padW, PIN, 'rx="2"'))
    parts.push(rect(x0 + off - padH / 2, y0 + body - 4 - padW, padH, padW, PIN, 'rx="2"'))
  }
  parts.push(`    <circle cx="${x0 + 28}" cy="${y0 + 28}" r="9" fill="${ACCENT}"/>`)
  return parts.join('\n')
}

/** DIP — корпус с ногами вниз через отверстия (through-hole). */
function dip(label: string, perSide: number): string {
  const bodyW = 200
  const bodyH = 110
  const x0 = CX - bodyW / 2
  const y0 = 150
  const parts: string[] = []
  const pinW = 12
  const pinH = 40
  const step = bodyW / perSide
  for (let i = 0; i < perSide; i++) {
    const x = x0 + step * i + step / 2 - pinW / 2
    parts.push(rect(x, y0 + bodyH, pinW, pinH, PIN, 'rx="2"'))
  }
  parts.push(rect(x0, y0, bodyW, bodyH, BODY, 'rx="6"'))
  // notch — полукруг сверху по центру
  parts.push(`    <path d="M ${CX - 18} ${y0} A 18 18 0 0 0 ${CX + 18} ${y0} Z" fill="${BG}"/>`)
  parts.push(`    <circle cx="${x0 + 22}" cy="${y0 + bodyH - 22}" r="8" fill="${ACCENT}"/>`)
  return parts.join('\n')
}

/** TO-220 — корпус с металлическим фланцем и 3 ногами. */
function to220(): string {
  const bodyW = 120
  const bodyH = 130
  const x0 = CX - bodyW / 2
  const y0 = 100
  const parts: string[] = []
  // фланец
  parts.push(rect(x0, y0, bodyW, 30, PIN, 'rx="4"'))
  parts.push(`    <circle cx="${CX}" cy="${y0 + 15}" r="9" fill="${BG}"/>`) // отверстие
  // тело
  parts.push(rect(x0, y0 + 30, bodyW, bodyH, BODY, 'rx="4"'))
  // 3 ноги
  for (let i = 0; i < 3; i++) {
    const x = x0 + 20 + i * 40 - 5
    parts.push(rect(x, y0 + 30 + bodyH, 10, 50, PIN, 'rx="2"'))
  }
  return parts.join('\n')
}

/** DPAK/D2PAK (TO-252/TO-263) — SMD power с tab. */
function dpak(): string {
  const bodyW = 160
  const bodyH = 120
  const x0 = CX - bodyW / 2
  const y0 = 120
  const parts: string[] = []
  // tab сверху
  parts.push(rect(x0 + 30, y0 - 30, bodyW - 60, 30, PIN, 'rx="3"'))
  parts.push(rect(x0, y0, bodyW, bodyH, BODY, 'rx="6"'))
  // 3 ноги вниз
  for (let i = 0; i < 3; i++) {
    const x = x0 + 30 + i * 50 - 8
    parts.push(rect(x, y0 + bodyH, 16, 34, PIN, 'rx="2"'))
  }
  parts.push(`    <circle cx="${x0 + 24}" cy="${y0 + 24}" r="8" fill="${ACCENT}"/>`)
  return parts.join('\n')
}

/** TO-92 — радиальный корпус с плоской гранью и 3 ногами. */
function to92(): string {
  const cx = CX
  const cy = 150
  const r = 80
  const parts: string[] = []
  // полукруг с плоской гранью снизу
  parts.push(
    `    <path d="M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} Z" fill="${BODY}"/>`,
  )
  parts.push(rect(cx - r, cy - 4, r * 2, 8, BODY))
  // 3 ноги вниз
  for (let i = 0; i < 3; i++) {
    const x = cx - 40 + i * 40 - 5
    parts.push(rect(x, cy, 10, 90, PIN, 'rx="2"'))
  }
  return parts.join('\n')
}

/** SOD — двухвыводной SMD-диод с полоской катода. */
function sod(): string {
  const bodyW = 180
  const bodyH = 90
  const x0 = CX - bodyW / 2
  const y0 = 150
  const parts: string[] = []
  const pinW = 30
  parts.push(rect(x0 - pinW, y0 + 20, pinW, bodyH - 40, PIN, 'rx="2"'))
  parts.push(rect(x0 + bodyW, y0 + 20, pinW, bodyH - 40, PIN, 'rx="2"'))
  parts.push(rect(x0, y0, bodyW, bodyH, BODY, 'rx="6"'))
  // полоска катода
  parts.push(rect(x0 + bodyW - 24, y0, 12, bodyH, ACCENT))
  return parts.join('\n')
}

/** BGA — квадрат с сеткой шариков. */
function bga(): string {
  const body = 180
  const x0 = CX - body / 2
  const y0 = 105
  const parts: string[] = [rect(x0, y0, body, body, BODY, 'rx="10"')]
  const n = 6
  const pad = 26
  const step = (body - pad * 2) / (n - 1)
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cx = x0 + pad + c * step
      const cy = y0 + pad + r * step
      parts.push(`    <circle cx="${cx}" cy="${cy}" r="8" fill="${PIN}"/>`)
    }
  }
  return parts.join('\n')
}

/** Chip — двухвыводной SMD (резистор/конденсатор 0805 и т.п.). */
function chip(): string {
  const bodyW = 200
  const bodyH = 110
  const x0 = CX - bodyW / 2
  const y0 = 140
  const parts: string[] = []
  const term = 36
  parts.push(rect(x0, y0, term, bodyH, PIN, 'rx="3"'))
  parts.push(rect(x0 + bodyW - term, y0, term, bodyH, PIN, 'rx="3"'))
  parts.push(rect(x0 + term, y0, bodyW - term * 2, bodyH, BODY))
  return parts.join('\n')
}

const FILES: Record<string, string> = {
  soic: svg('SOIC', gullWing('SOIC', 4, 150)),
  msop: svg('MSOP', gullWing('MSOP', 4, 110)),
  tssop: svg('TSSOP', gullWing('TSSOP', 7, 150)),
  sot23: svg('SOT-23', smallOutline('SOT-23', 5)),
  sc70: svg('SC-70', smallOutline('SC-70', 5)),
  qfn: svg('QFN', quadNoLead('QFN', 6)),
  qfp: svg('QFP', quadFlat('QFP', 7)),
  dip: svg('DIP', dip('DIP', 4)),
  to220: svg('TO-220', to220()),
  to252: svg('TO-252', dpak()),
  to263: svg('TO-263', dpak()),
  to92: svg('TO-92', to92()),
  sod: svg('SOD', sod()),
  bga: svg('BGA', bga()),
  chip: svg('Chip SMD', chip()),
}

function main(): void {
  mkdirSync(OUT, { recursive: true })
  for (const [name, content] of Object.entries(FILES)) {
    writeFileSync(resolve(OUT, `${name}.svg`), content)
    console.log(`  wrote packages/${name}.svg`)
  }
  console.log(`\nDone — ${Object.keys(FILES).length} package SVGs`)
}

main()
