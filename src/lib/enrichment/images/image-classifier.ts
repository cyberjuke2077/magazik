import sharp from 'sharp'

/**
 * Классификатор изображений товара от LCSC/Mouser.
 *
 * Зачем: LCSC отдаёт вперемешку три вида картинок —
 *   1. clean     — чистое фото компонента на белом фоне (годится);
 *   2. watermark — фото с синим «ruler»-фоном и/или логотипом LCSC,
 *                  наложенным поверх; снять знак без потери качества
 *                  нельзя, поэтому такие отбрасываем;
 *   3. junk      — заглушка «нет фото» (коробка LCSC с логотипами),
 *                  один и тот же файл у множества разных товаров.
 *
 * Метод — дешёвая попиксельная эвристика на уменьшенной до 64×64 копии
 * (raw RGB). Пороги откалиброваны на реальной выборке каталога
 * (см. scripts/_calib-classifier.ts): у clean blueWm≈0 и edgeBlue≈0,
 * у watermark/junk синева заметно выше, особенно по краям кадра.
 *
 * junk-коробки по метрикам тоже попадают в 'watermark' (высокая синева),
 * так что для pipeline отдельный детект дублей не нужен — годится только
 * clean. Точный детект junk-по-хэшу нужен лишь бэкфиллу, где видна
 * частота повторов; для этого экспортируется contentHash().
 */

import crypto from 'node:crypto'

export type ImageVerdict = 'clean' | 'watermark'

export interface ImageFeatures {
  /** доля «синих» пикселей тона LCSC watermark во всём кадре */
  blueWm: number
  /** доля почти-белых пикселей (фон) */
  white: number
  /** доля тёмных пикселей (тело компонента) */
  dark: number
  /** доля синих пикселей в рамке кадра (8px) — watermark тяготеет к краям */
  edgeBlue: number
}

export interface ClassificationResult {
  verdict: ImageVerdict
  features: ImageFeatures
}

/** Размер уменьшенной копии для анализа. */
const ANALYZE_SIZE = 64
/** Ширина краевой рамки в пикселях (для edgeBlue). */
const EDGE_BAND = 8

/**
 * Пороги (откалиброваны на выборке каталога):
 *   clean ⟺ edgeBlue < EDGE_BLUE_MAX И blueWm < BLUE_WM_MAX.
 * Любое превышение → watermark.
 */
const EDGE_BLUE_MAX = 0.04
const BLUE_WM_MAX = 0.12

/**
 * Считает пиксельные признаки изображения.
 * Прозрачность сводится к белому фону (как и финальный рендер карточки).
 */
export async function computeFeatures(input: Buffer): Promise<ImageFeatures> {
  const { data, info } = await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(ANALYZE_SIZE, ANALYZE_SIZE, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const ch = info.channels
  const px = ANALYZE_SIZE * ANALYZE_SIZE
  let blueWm = 0
  let white = 0
  let dark = 0
  let edgeBlue = 0
  let edgeN = 0

  for (let y = 0; y < ANALYZE_SIZE; y++) {
    for (let x = 0; x < ANALYZE_SIZE; x++) {
      const i = (y * ANALYZE_SIZE + x) * ch
      const r = data[i]!
      const g = data[i + 1]!
      const b = data[i + 2]!

      const isWhite = r > 235 && g > 235 && b > 235
      const isDark = r < 80 && g < 80 && b < 80
      // «синева LCSC»: голубой/синий тон, b доминирует, не белый.
      const isBlue = b > 90 && b - r > 25 && b - g > 12 && !isWhite

      if (isWhite) white++
      if (isDark) dark++
      if (isBlue) blueWm++

      const onEdge =
        x < EDGE_BAND ||
        x >= ANALYZE_SIZE - EDGE_BAND ||
        y < EDGE_BAND ||
        y >= ANALYZE_SIZE - EDGE_BAND
      if (onEdge) {
        edgeN++
        if (isBlue) edgeBlue++
      }
    }
  }

  return {
    blueWm: blueWm / px,
    white: white / px,
    dark: dark / px,
    edgeBlue: edgeN > 0 ? edgeBlue / edgeN : 0,
  }
}

/**
 * Классифицирует изображение. Возвращает вердикт и признаки.
 * Бросает только если sharp не смог декодировать буфер.
 */
export async function classifyImage(input: Buffer): Promise<ClassificationResult> {
  const features = await computeFeatures(input)
  const isClean = features.edgeBlue < EDGE_BLUE_MAX && features.blueWm < BLUE_WM_MAX
  return { verdict: isClean ? 'clean' : 'watermark', features }
}

/** Удобный предикат: пройдёт ли изображение в каталог. */
export async function isCleanImage(input: Buffer): Promise<boolean> {
  return (await classifyImage(input)).verdict === 'clean'
}

/**
 * SHA-1 байтов контента (не URL). Используется бэкфиллом для поиска
 * junk-дублей: один и тот же hash у ≥N разных товаров = заглушка LCSC.
 */
export function contentHash(input: Buffer): string {
  return crypto.createHash('sha1').update(input).digest('hex')
}
