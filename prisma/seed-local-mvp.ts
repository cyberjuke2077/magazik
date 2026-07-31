import 'dotenv/config'

function requiredEnv(name: 'POSTGRES_USER' | 'POSTGRES_PASSWORD' | 'POSTGRES_DB'): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for the local MVP seed`)
  return value
}

function localDatabaseUrl(): string {
  const user = encodeURIComponent(requiredEnv('POSTGRES_USER'))
  const password = encodeURIComponent(requiredEnv('POSTGRES_PASSWORD'))
  const database = encodeURIComponent(requiredEnv('POSTGRES_DB'))
  return `postgresql://${user}:${password}@127.0.0.1:5432/${database}?schema=public`
}

async function main() {
  const databaseUrl = localDatabaseUrl()
  const host = new URL(databaseUrl).hostname

  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '[::1]') {
    throw new Error(`Refusing to seed a non-local database host: ${host}`)
  }

  // Prisma reads the connection URLs during client construction, so set both
  // before importing the shared client. This script never uses the remote URL
  // that may be present in .env.
  process.env.DATABASE_URL = databaseUrl
  process.env.DIRECT_URL = databaseUrl

  const { prisma } = await import('../src/lib/prisma')

  try {
    const [power, microcontrollers, passives, st, ti, yageo] = await prisma.$transaction([
      prisma.category.upsert({
        where: { slug: 'pitanie' },
        update: { name: 'Питание и управление питанием' },
        create: {
          slug: 'pitanie',
          name: 'Питание и управление питанием',
          description: 'Стабилизаторы, преобразователи и контроллеры питания',
          color: '#2563eb',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'mikrokontrollery' },
        update: { name: 'Микроконтроллеры' },
        create: {
          slug: 'mikrokontrollery',
          name: 'Микроконтроллеры',
          description: 'Микроконтроллеры и встраиваемые процессоры',
          color: '#0f766e',
        },
      }),
      prisma.category.upsert({
        where: { slug: 'passivnye-komponenty' },
        update: { name: 'Пассивные компоненты' },
        create: {
          slug: 'passivnye-komponenty',
          name: 'Пассивные компоненты',
          description: 'Резисторы, конденсаторы и другие пассивные компоненты',
          color: '#7c3aed',
        },
      }),
      prisma.manufacturer.upsert({
        where: { slug: 'st-microelectronics' },
        update: { name: 'STMicroelectronics' },
        create: { slug: 'st-microelectronics', name: 'STMicroelectronics' },
      }),
      prisma.manufacturer.upsert({
        where: { slug: 'texas-instruments' },
        update: { name: 'Texas Instruments' },
        create: { slug: 'texas-instruments', name: 'Texas Instruments' },
      }),
      prisma.manufacturer.upsert({
        where: { slug: 'yageo' },
        update: { name: 'Yageo' },
        create: { slug: 'yageo', name: 'Yageo' },
      }),
    ])

    const products = [
      {
        slug: 'tps5430ddar-local-mvp',
        name: 'Понижающий преобразователь TPS5430DDAR',
        partNumber: 'TPS5430DDAR',
        sku: 'LOCAL-MVP-001',
        description: 'Понижающий DC/DC-преобразователь для проверки локального MVP.',
        mpnNormalized: 'TPS5430DDAR',
        package: 'SOIC-8',
        categoryId: power.id,
        manufacturerId: ti.id,
        price: '430.00',
        priceWholesale: '385.00',
        stockCount: 240,
        minOrder: 10,
        tags: ['dc-dc', 'питание', 'local-mvp'],
        datasheets: [
          {
            title: 'TPS5430, TPS5431 Datasheet',
            url: 'https://www.ti.com/lit/ds/symlink/tps5430.pdf',
            language: 'en',
          },
        ],
        specifications: [
          { key: 'Входное напряжение', value: '5,5-36 В', order: 0 },
          { key: 'Выходной ток', value: '3 А', order: 1 },
        ],
      },
      {
        slug: 'stm32f103c8t6-local-mvp',
        name: 'Микроконтроллер STM32F103C8T6',
        partNumber: 'STM32F103C8T6',
        sku: 'LOCAL-MVP-002',
        description: '32-битный микроконтроллер Arm Cortex-M3 для проверки поиска по MPN.',
        mpnNormalized: 'STM32F103C8T6',
        package: 'LQFP-48',
        categoryId: microcontrollers.id,
        manufacturerId: st.id,
        price: '560.00',
        priceWholesale: '510.00',
        stockCount: 180,
        minOrder: 5,
        tags: ['mcu', 'stm32', 'local-mvp'],
        datasheets: [
          {
            title: 'STM32F103C8 Datasheet',
            url: 'https://www.st.com/resource/en/datasheet/stm32f103c8.pdf',
            language: 'en',
          },
        ],
        specifications: [
          { key: 'Ядро', value: 'Arm Cortex-M3', order: 0 },
          { key: 'Flash-память', value: '64 КБ', order: 1 },
        ],
      },
      {
        slug: 'rc0603fr-0710kl-local-mvp',
        name: 'Резистор 10 кОм RC0603FR-0710KL',
        partNumber: 'RC0603FR-0710KL',
        sku: 'LOCAL-MVP-003',
        description: 'Чип-резистор 0603 с допуском 1% для проверки локального каталога.',
        mpnNormalized: 'RC0603FR0710KL',
        package: '0603',
        categoryId: passives.id,
        manufacturerId: yageo.id,
        price: '1.90',
        priceWholesale: '1.45',
        stockCount: 25000,
        minOrder: 100,
        tags: ['резистор', '0603', 'local-mvp'],
        datasheets: [],
        specifications: [
          { key: 'Сопротивление', value: '10 кОм', order: 0 },
          { key: 'Допуск', value: '1%', order: 1 },
        ],
      },
    ]

    for (const product of products) {
      const { specifications, datasheets, ...data } = product
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          ...data,
          currency: 'RUB',
          unit: 'шт',
          inStock: true,
          featured: true,
          enrichmentStatus: 'complete',
          lastEnrichedAt: new Date(),
          specifications: {
            deleteMany: {},
            create: specifications.map((specification) => ({ ...specification })),
          },
          datasheets: {
            deleteMany: {},
            create: datasheets.map((datasheet) => ({ ...datasheet })),
          },
        },
        create: {
          ...data,
          currency: 'RUB',
          unit: 'шт',
          inStock: true,
          featured: true,
          enrichmentStatus: 'complete',
          lastEnrichedAt: new Date(),
          specifications: {
            create: specifications.map((specification) => ({ ...specification })),
          },
          datasheets: {
            create: datasheets.map((datasheet) => ({ ...datasheet })),
          },
        },
      })
    }

    console.log(`Local MVP seed is ready: ${products.length} products`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error('Local MVP seed failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
