/**
 * Маппинг брендов поставщика → канонические имена производителей.
 *
 * Ключи — UPPERCASE для case-insensitive lookup.
 * При поиске: `BRAND_MAP[raw.toUpperCase().trim()]`
 */
export const BRAND_MAP: Record<string, string> = {
  // Maxim Integrated (acquired by Analog Devices)
  'MAXIM/美信': 'Maxim Integrated',
  'MAXIM': 'Maxim Integrated',
  '美信': 'Maxim Integrated',

  // Texas Instruments
  'TI/德州仪器': 'Texas Instruments',
  'TI': 'Texas Instruments',
  '德州仪器': 'Texas Instruments',
  'TEXAS INSTRUMENTS': 'Texas Instruments',

  // STMicroelectronics
  'ST': 'STMicroelectronics',
  'STMICROELECTRONICS': 'STMicroelectronics',

  // Microchip Technology (acquired Atmel)
  'ATMEL': 'Microchip Technology',
  'MICROCHIP': 'Microchip Technology',
  'MICROCHIP TECHNOLOGY': 'Microchip Technology',

  // Analog Devices
  'ADI': 'Analog Devices',
  'ANALOG DEVICES': 'Analog Devices',

  // AMD (Xilinx) — acquired by AMD
  'XILINX': 'AMD (Xilinx)',
  'AMD': 'AMD (Xilinx)',

  // Qualcomm
  'QUALCOMM': 'Qualcomm',

  // Vishay
  'VISHAY': 'Vishay',

  // Infineon Technologies
  'INFINEON': 'Infineon Technologies',
  'INFINEON TECHNOLOGIES': 'Infineon Technologies',

  // NXP Semiconductors
  'NXP': 'NXP Semiconductors',
  'NXP SEMICONDUCTORS': 'NXP Semiconductors',

  // onsemi (formerly ON Semiconductor)
  'ON SEMICONDUCTOR': 'onsemi',
  'ONSEMI': 'onsemi',

  // Renesas Electronics
  'RENESAS': 'Renesas Electronics',
  'RENESAS ELECTRONICS': 'Renesas Electronics',

  // Micron Technology
  'MICRON': 'Micron Technology',
  '镁光': 'Micron Technology',
  'MICRON/镁光': 'Micron Technology',
  'MICRON TECHNOLOGY': 'Micron Technology',

  // WK Microelectronics
  'WK/为开微': 'WK Microelectronics',
  'WK': 'WK Microelectronics',
}

/**
 * Карта поглощений брендов.
 *
 * Ключ — текущий владелец, значение — список поглощённых брендов.
 * Используется для расширенного поиска: если MPN не найден под текущим брендом,
 * можно попробовать поиск под историческим именем.
 */
export const BRAND_ACQUISITIONS: Record<string, string[]> = {
  'Analog Devices': ['Maxim Integrated'],
  'Microchip Technology': ['Atmel'],
  'AMD (Xilinx)': ['Xilinx'],
  'onsemi': ['ON Semiconductor', 'Fairchild Semiconductor'],
  'Infineon Technologies': ['International Rectifier', 'Cypress Semiconductor'],
  'Renesas Electronics': ['Intersil', 'IDT'],
}
