# Implementation Plan: Каталог и модель заказа

## Overview

Реализация серверного каталога товаров с полнотекстовым поиском (PostgreSQL tsvector + GIN), фильтрацией, пагинацией и моделью запроса коммерческого предложения (QuoteRequest). Архитектура: Server Components (Next.js 15 App Router) + минимальные клиентские компоненты для интерактивности. Список запроса хранится в localStorage.

## Tasks

- [x] 1. Prisma-миграция: tsvector + QuoteRequest
  - [x] 1.1 Добавить tsvector-колонку и GIN-индекс к модели Product
    - Создать SQL-миграцию, добавляющую колонку `searchVector tsvector GENERATED ALWAYS AS (...)` с весами A/B/C для partNumber/name/description
    - Создать GIN-индекс `Product_searchVector_idx`
    - Обновить `prisma/schema.prisma` — добавить `searchVector` как `Unsupported("tsvector")?` с аннотацией `@ignore`
    - _Requirements: 3.1_

  - [x] 1.2 Добавить модели QuoteRequest и QuoteRequestItem в Prisma-схему
    - Добавить модель `QuoteRequest` с полями: status, companyName, inn, contactPerson, phone, email, comment, deliveryAddress, desiredDeliveryDate, createdAt, updatedAt
    - Добавить модель `QuoteRequestItem` с полями: quoteRequestId, productId, partNumber, name, quantity, requestedPrice
    - Добавить индексы по status, createdAt, email, quoteRequestId, productId
    - Запустить `prisma migrate dev` для генерации миграции
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Backend-запросы: пагинация, FTS, фильтры
  - [x] 2.1 Реализовать утилиты `parseCatalogParams` и `formatPrice`
    - Создать файл `src/lib/catalog-utils.ts`
    - Реализовать `parseCatalogParams(searchParams, totalItems)` с clamping page/limit
    - Реализовать `formatPrice(price, currency?)` — null → «Цена по запросу», number → «1 234 ₽»
    - _Requirements: 1.2, 1.3, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Property-тест: форматирование цены
    - **Property 1: Форматирование цены**
    - Для любого price > 0 результат содержит «₽» и корректные разделители тысяч; для null — «Цена по запросу»
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 2.3 Property-тест: корректность пагинации
    - **Property 2: Корректность пагинации (offset и clamping)**
    - Для любых page ≥ 1, limit ≥ 1, total ≥ 0: offset = (clampedPage-1)*limit, clampedPage ≤ ceil(total/limit)
    - **Validates: Requirements 2.3, 2.5, 2.6**

  - [x] 2.4 Реализовать `getProductsPaginated()` с FTS и фильтрами
    - Создать файл `src/lib/queries/products.ts`
    - Реализовать запрос с `plainto_tsquery('russian', ...)` по searchVector
    - Поддержать фильтры: categorySlug (JOIN Category), manufacturerSlug (JOIN Manufacturer)
    - Offset-based пагинация с COUNT для total
    - Вернуть `PaginatedResult<Product>`
    - _Requirements: 3.1, 3.2, 3.4, 4.4, 4.6_

  - [x] 2.5 Реализовать `getCategoriesWithCounts()`
    - Создать файл `src/lib/queries/categories.ts`
    - Запрос дерева категорий с подсчётом товаров в каждой (с учётом активных фильтров)
    - Вернуть иерархическую структуру для рендера дерева
    - _Requirements: 4.1_

- [x] 3. Checkpoint — Проверка backend-слоя
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Server Component: каталог
  - [x] 4.1 Переписать `src/app/catalog/page.tsx` как Server Component
    - Читать `searchParams` (page, limit, q, category, manufacturer)
    - Вызывать `parseCatalogParams` + `getProductsPaginated` + `getCategoriesWithCounts`
    - Рендерить layout: боковая панель (дерево категорий) + список товаров + пагинатор
    - Отображать «Ничего не найдено» при пустых результатах
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.6, 3.2, 3.5, 8.1, 8.2, 8.3_

  - [x] 4.2 Создать `loading.tsx` и `error.tsx` для каталога
    - Skeleton-загрузка для списка товаров
    - Обработка ошибок с возможностью повторить
    - _Requirements: 1.4_

- [x] 5. Клиентские компоненты каталога
  - [x] 5.1 Реализовать `SearchInput` — поисковая строка с debounce
    - Создать `src/app/catalog/components/search-input.tsx` ('use client')
    - Debounce 300ms, обновление URL через `useRouter().replace()` с параметром `q`
    - Сброс page=1 при изменении запроса
    - _Requirements: 3.3, 4.5, 8.5_

  - [x] 5.2 Реализовать `QuantityStepper` — степпер количества
    - Создать `src/app/catalog/components/quantity-stepper.tsx` ('use client')
    - Учёт minOrder: не позволять уменьшить ниже minOrder
    - Кнопки +/- и ручной ввод
    - _Requirements: 5.4_

  - [x] 5.3 Реализовать `AddToRequestBtn` — кнопка добавления в запрос
    - Создать `src/app/catalog/components/add-to-request-btn.tsx` ('use client')
    - Добавление товара в localStorage-список
    - Отображение «В списке» если товар уже добавлен
    - _Requirements: 5.1, 5.3_

  - [x] 5.4 Реализовать `CategoryTree` — дерево категорий
    - Создать `src/app/catalog/components/category-tree.tsx` ('use client')
    - Expand/collapse узлов, отображение количества товаров
    - Навигация через URL-параметр `?category=slug`
    - _Requirements: 4.1, 4.2_

  - [ ]* 5.5 Property-тест: round-trip URL-параметров каталога
    - **Property 7: Round-trip URL-параметров каталога**
    - Сериализация параметров в URL и обратный парсинг возвращают эквивалентный набор
    - **Validates: Requirements 8.1, 8.3**

- [x] 6. Checkpoint — Проверка каталога
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Список запроса (корзина) и localStorage
  - [x] 7.1 Реализовать `RequestListStore` — хранилище списка запроса
    - Создать `src/lib/request-list-store.ts`
    - Функции: addItem, removeItem, updateQuantity, getItems, clearAll
    - Сериализация/десериализация в localStorage с ключом `electromagaz_request_list`
    - Graceful degradation при недоступности localStorage
    - _Requirements: 5.2, 5.4, 5.5_

  - [ ]* 7.2 Property-тест: round-trip списка запроса
    - **Property 4: Round-trip списка запроса**
    - Сериализация и десериализация RequestListItem[] сохраняют все поля
    - **Validates: Requirements 5.2, 5.5**

  - [ ]* 7.3 Property-тест: инвариант минимального заказа
    - **Property 5: Инвариант минимального заказа**
    - quantity всегда ≥ minOrder после любой операции updateQuantity
    - **Validates: Requirements 5.4**

  - [x] 7.4 Реализовать страницу списка запроса
    - Создать `src/app/request-list/page.tsx`
    - Отображение позиций из localStorage, изменение количества, удаление
    - Кнопка «Оформить запрос» → переход к форме
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 7.5 Реализовать форму отправки запроса
    - Создать `src/app/request-list/submit/page.tsx`
    - Поля: companyName, inn, contactPerson, phone, email, comment, deliveryAddress, desiredDeliveryDate
    - Валидация на клиенте перед отправкой
    - _Requirements: 6.1, 6.3_

- [x] 8. Server action: submitQuoteRequest
  - [x] 8.1 Реализовать server action `submitQuoteRequest`
    - Создать `src/app/catalog/actions.ts`
    - Валидация входных данных (обязательные поля, непустой items)
    - Сохранение QuoteRequest + QuoteRequestItem в БД через Prisma
    - Отправка email менеджеру через nodemailer
    - Возврат `{ success: true, requestId }` или `{ success: false, error }`
    - При ошибке email — логирование, запрос всё равно сохраняется
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.5_

  - [ ]* 8.2 Property-тест: валидация QuoteRequest
    - **Property 6: Валидация QuoteRequest**
    - Все обязательные поля непустые, items.length ≥ 1, status ∈ {new, in_progress, quoted, rejected}
    - **Validates: Requirements 6.3, 7.2**

- [x] 9. Checkpoint — Проверка бизнес-логики
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. UI-полировка
  - [x] 10.1 Стилизация строк каталога в стиле ChipDip
    - Компактные строки: partNumber (жирный), name, manufacturer, «2–4 недели», цена/«Цена по запросу»
    - Tailwind CSS, адаптивная вёрстка
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 10.2 Реализовать компонент пагинации
    - Кнопки «Назад»/«Вперёд», номера страниц, отображение диапазона «51–100 из 62 627»
    - Навигация через URL-параметры
    - _Requirements: 2.2, 2.6_

  - [x] 10.3 Реализовать хлебные крошки и бейдж списка запроса
    - Хлебные крошки: Главная → Каталог → Категория
    - Бейдж в хедере с количеством позиций в списке запроса
    - _Requirements: 4.1, 5.1_

- [x] 11. Финальный checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Проект использует TypeScript, Vitest + fast-check для property-тестов
- Server Components по умолчанию, 'use client' только для интерактивных компонентов
- Миграция tsvector выполняется через raw SQL (Prisma не поддерживает generated columns нативно)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.5"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "7.1"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "7.2", "7.3"] },
    { "id": 5, "tasks": ["7.4", "7.5"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "10.1", "10.2", "10.3"] }
  ]
}
```
