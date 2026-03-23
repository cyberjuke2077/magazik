# AGENTS.md

Инструкции для AI-агентов (Cursor, Copilot, Claude и др.), работающих в этом репозитории.

---

## Проект

**Electromagaz** — интернет-магазин микроэлектроники и промышленной автоматики.
Большой каталог товаров (резисторы, конденсаторы, реле, датчики, контроллеры и т.д.),
поиск по маркировке/артикулу, корзина, заказы, личный кабинет, оптовые цены.

Ориентир по функциональности: chipdip.ru, zener.ru, olnisa.ru.

---

## Технологический стек

| Слой            | Технология                              |
|-----------------|-----------------------------------------|
| Framework       | Next.js 15 (App Router)                 |
| Язык            | TypeScript (strict mode)                |
| Стили           | Tailwind CSS                            |
| API             | tRPC (типобезопасный API)               |
| БД              | PostgreSQL                              |
| ORM             | Prisma                                  |
| Поиск           | Meilisearch                             |
| Пакет. менеджер | pnpm                                    |
| Тесты (unit)    | Vitest                                  |
| Тесты (e2e)     | Playwright                              |
| Линтер          | ESLint + Prettier                       |
| Деплой          | Docker + VPS                            |

---

## Команды

```bash
# Установка зависимостей
pnpm install

# Запуск dev-сервера
pnpm dev

# Сборка
pnpm build

# Запуск продакшн-сборки
pnpm start

# Линтинг
pnpm lint

# Форматирование
pnpm format

# Все unit-тесты
pnpm test

# Один unit-тест
pnpm test src/path/to/file.test.ts

# Тесты в watch-режиме
pnpm test:watch

# E2E тесты (Playwright)
pnpm test:e2e

# Один e2e тест
pnpm test:e2e -- --grep "название теста"

# Prisma — применить миграции
pnpm db:migrate

# Prisma — открыть Studio
pnpm db:studio

# Prisma — сгенерировать клиент
pnpm db:generate
```

---

## Структура проекта

```
/
├── src/
│   ├── app/                  # Next.js App Router (страницы и layouts)
│   │   ├── (shop)/           # Группа маршрутов магазина
│   │   │   ├── catalog/      # Каталог товаров
│   │   │   ├── product/      # Страница товара
│   │   │   ├── cart/         # Корзина
│   │   │   └── checkout/     # Оформление заказа
│   │   ├── account/          # Личный кабинет
│   │   └── api/              # API routes (tRPC handler)
│   ├── components/
│   │   ├── ui/               # Базовые UI-компоненты (Button, Input и т.д.)
│   │   ├── catalog/          # Компоненты каталога
│   │   ├── product/          # Компоненты карточки товара
│   │   └── layout/           # Header, Footer, Sidebar
│   ├── server/
│   │   ├── routers/          # tRPC роутеры
│   │   ├── db/               # Prisma клиент и утилиты БД
│   │   └── services/         # Бизнес-логика
│   ├── lib/                  # Утилиты, хелперы, константы
│   ├── hooks/                # React хуки
│   ├── types/                # Глобальные TypeScript типы
│   └── styles/               # Глобальные стили
├── prisma/
│   ├── schema.prisma         # Схема БД
│   └── migrations/           # Миграции
├── tests/
│   ├── unit/                 # Vitest unit-тесты
│   └── e2e/                  # Playwright e2e тесты
├── public/                   # Статические файлы
└── AGENTS.md
```

---

## Стиль кода

### Общие правила

- Пиши чистый, читаемый код — предпочитай ясность краткости
- Одна ответственность на функцию/модуль
- Не оставляй закомментированный код в PR
- Удаляй неиспользуемые импорты и переменные
- Server Components по умолчанию — `'use client'` только когда необходимо

### Именование

| Что               | Стиль       | Пример                    |
|-------------------|-------------|---------------------------|
| Переменные        | camelCase   | `productName`             |
| Функции           | camelCase   | `getProductById()`        |
| Классы/Сервисы    | PascalCase  | `ProductService`          |
| Константы         | UPPER_SNAKE | `MAX_CART_ITEMS`          |
| Файлы/папки       | kebab-case  | `product-card.tsx`        |
| React компоненты  | PascalCase  | `ProductCard.tsx`         |
| Типы/Интерфейсы   | PascalCase  | `ProductVariant`          |
| tRPC роутеры      | camelCase   | `productRouter`           |
| Prisma модели     | PascalCase  | `model Product {}`        |

### Импорты

Порядок групп (разделяй пустой строкой):
1. Сторонние библиотеки
2. Алиасы проекта (`@/...`)
3. Относительные импорты (`./...`)

```ts
// ✅ Правильно
import { useState } from 'react'
import { type NextPage } from 'next'

import { trpc } from '@/lib/trpc'
import { ProductCard } from '@/components/product'

import { formatPrice } from './utils'
```

### Типизация

- Включён `strict: true` в tsconfig — не отключать
- Всегда указывай типы аргументов и возвращаемых значений
- Избегай `any` — используй `unknown` если тип неизвестен
- `interface` для объектов/пропсов, `type` для union/intersection
- Используй `type` при импорте только типов: `import { type Product }`

```ts
// ✅ Правильно
interface ProductCardProps {
  product: Product
  onAddToCart: (id: string) => void
}

async function getProduct(id: string): Promise<Product | null> {
  return prisma.product.findUnique({ where: { id } })
}

// ❌ Неправильно
function getProduct(id): any { ... }
```

### Обработка ошибок

- Всегда обрабатывай ошибки явно — не глотай исключения
- В tRPC роутерах бросай `TRPCError` с понятным кодом
- Логируй ошибки с контекстом

```ts
// ✅ Правильно — tRPC роутер
import { TRPCError } from '@trpc/server'

const product = await prisma.product.findUnique({ where: { id } })
if (!product) {
  throw new TRPCError({ code: 'NOT_FOUND', message: `Product ${id} not found` })
}

// ✅ Правильно — async/await
try {
  const result = await searchProducts(query)
  return result
} catch (error) {
  console.error('Search failed', { query, error })
  throw error
}
```

### Форматирование

- Отступы: **2 пробела**
- Кавычки: **одинарные** `'`
- Точка с запятой: **нет** (настроено в Prettier)
- Максимальная длина строки: **100 символов**
- Пустая строка в конце файла
- Trailing commas: `'all'`

### React / Next.js

- Используй Server Components везде где нет интерактивности
- Данные fetching — в Server Components через Prisma напрямую или tRPC server-side
- Клиентские компоненты (`'use client'`) — только для: хуки, события, браузерные API
- Используй `loading.tsx` и `error.tsx` для каждого роута
- Изображения — только через `next/image`
- Навигация — только через `next/link`

---

## Работа с Git

### Ветки

```
main        — продакшн, прямые коммиты запрещены
develop     — основная ветка разработки
feature/... — новая функциональность  (feature/product-search)
fix/...     — исправление багов        (fix/cart-quantity-bug)
chore/...   — зависимости, конфиги     (chore/update-prisma)
```

### Коммиты (Conventional Commits)

```
feat: добавить поиск по маркировке товара
fix: исправить подсчёт количества в корзине
chore: обновить зависимости Prisma
refactor: вынести логику фильтрации в хук useFilters
docs: обновить AGENTS.md
test: добавить тесты для ProductService
```

---

## Переменные окружения

```bash
# БД
DATABASE_URL="postgresql://user:password@localhost:5432/electromagaz"

# Meilisearch
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="your-api-key"

# Next.js
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Никогда не коммить `.env` файлы. Шаблон хранится в `.env.example`.

---

## Правила для AI-агентов

1. **Не меняй** файлы вне области задачи без явного запроса
2. **Не удаляй** существующие тесты
3. **Проверяй** что новый код покрыт тестами
4. **Следуй** стилю кода, уже существующему в файле
5. **Не коммить** `.env`, секреты, credentials
6. **Спрашивай** если задача неоднозначна — не угадывай
7. **Один PR** — одна задача, не смешивай несвязанные изменения
8. **Server Components** по умолчанию — не добавляй `'use client'` без необходимости
9. **Типизация строгая** — не используй `any`, не отключай strict в tsconfig
10. **Prisma** — все изменения схемы через миграции (`pnpm db:migrate`), не вручную

---

*Последнее обновление: март 2026*
