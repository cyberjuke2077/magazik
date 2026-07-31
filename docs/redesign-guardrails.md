# Методичка для редизайна: что нельзя сломать

Документ для сессии редизайна. Цель: менять визуал (вёрстку, стили, компоновку)
можно свободно, но логика фич не должна сломаться. Здесь — карта фич, где живёт
их логика и какие связи/зацепки критичны.

Главный принцип проекта: **логика отделена от визуала**. Состояние и действия —
в хуках (`src/hooks`), сторах (`src/lib/*-store.ts`) и server actions
(`actions.ts`, `'use server'`). JSX и Tailwind-классы — это только представление.
При редизайне переписывай разметку, но **сохраняй связи**: вызовы хуков,
`onClick`→action, `<form onSubmit>`→action, и DOM-зацепки ниже.

Актуально на: **2026-06-15**.

---

## Критичные DOM-зацепки (ломаются молча, без ошибок сборки)

| Зацепка | Где | Зачем | Что будет, если убрать |
|---|---|---|---|
| `data-cart-icon` | иконки корзины в `sticky-nav.tsx` (desktop + mobile) | селектор для анимации «полёта» товара в корзину (`src/lib/fly-to-cart.ts`, `querySelector('[data-cart-icon]')`) | анимация добавления тихо перестанет работать |
| `data-add-to-cart-block` | блок «в корзину» на карточке товара (`product/[slug]/product-client-chipdip.tsx`) | `IntersectionObserver`-триггер липкой панели `sticky-add-bar.tsx` (`triggerSelector`): панель всплывает, когда блок ушёл из вида | липкая панель добавления на карточке перестанет появляться |
| URL searchParams каталога (`category`, `sort`, `view`, `limit`, `page`) | `/catalog`, мега-меню, фильтры | канонизация SEO (`generateMetadata`, canonical схлопывает параметры) | поломка фильтров и/или дубли в индексе |

При смене разметки этих мест **перенеси атрибут/контракт на новый элемент**.

---

## Хранилище (localStorage) — не переименовывать ключи

| Ключ | Что хранит | Кто читает/пишет |
|---|---|---|
| `electromagaz_cart` | **единое** хранилище корзины (= «список запроса») | `hooks/use-cart.ts`, `catalog/components/add-to-cart-btn.tsx`, `lib/request-list-store.ts` (адаптер) |
| `electromagaz:compare` | список сравнения, лимит `MAX_COMPARE = 4` | `lib/compare-store.ts`, `hooks/use-compare.ts` |

⚠️ **Корзина и «список запроса» — это одно и то же хранилище.** `request-list-store.ts` —
это адаптер совместимости поверх `electromagaz_cart`, а не отдельный стор. Отсюда же
растёт «дубль форм заявки» (см. долги). Если при редизайне объединяешь cart и
request-list в один UX — это не потеря данных, они и так на одном ключе.

Смена имени ключа = у всех текущих пользователей пропадёт корзина. Не трогать.

---

## Карта фич

### Корзина / «список запроса»
- Логика: `src/hooks/use-cart.ts` (ключ `electromagaz_cart`).
- API хука: `items`, `totalPrice`, `mounted`, `addToCart/updateQty/clearCart` и т.д.
- Кнопка «в корзину» вызывает `fly-to-cart` (нужен `data-cart-icon`).
- Адаптер `request-list-store.ts` даёт «list»-API поверх того же хранилища.
- Страницы: `/cart`, `/request-list`. Иконка-счётчик в `sticky-nav.tsx`.
- Редизайн: можно менять вид кнопок/счётчика/страниц; сохранить вызовы useCart и `data-cart-icon`.

### Сравнение товаров
- Логика: `src/lib/compare-store.ts` (localStorage `electromagaz:compare`, лимит `MAX_COMPARE = 4`),
  хук `src/hooks/use-compare.ts`. `toggleCompare()` возвращает `'added' | 'removed' | 'full'`.
- SSR-данные: `src/app/compare/actions.ts` → `fetchCompareProducts(ids)`.
- UI: `compare-toggle-btn.tsx`, плавающий `compare-bar.tsx`, страница `/compare`.
- Редизайн: сохранить вызовы стора; учесть состояние `'full'` (тост при лимите 4).

### Поиск
- UI: `src/components/ui/live-search-dropdown.tsx` (дебаунс, дропдаун, клавиатура). Также `search-bar.tsx`.
- API: `/api/search` (`src/app/api/search/route.ts`).
- Редизайн: сохранить дебаунс и навигацию с клавиатуры; не ломать вызов `/api/search`.

### Мега-меню каталога
- В `sticky-nav.tsx`. Категории приходят пропсом ИЛИ подгружаются с `/api/catalog/categories`.
- Логика hover/клик-аутсайд завязана на refs. Ссылки категорий — `/catalog?category=<slug>`
  (каноничный URL). `/catalog/<slug>` отдаёт **301-редирект** на `/catalog?category=<slug>`
  (`app/catalog/[slug]/page.tsx`).
- Редизайн: сохранить fetch категорий и формат ссылок (`?category=`, не `/slug`).

### Заявка на КП (ключевой бизнес-поток)
- Формы: `/request-quote` (из корзины) и `/request-list/submit` (дубль, см. долги).
- Server action: `src/app/request-list/actions.ts` → `submitQuoteRequest` (серверная
  валидация `validate-quote-input.ts`, сохранение в БД, Telegram-уведомление).
- Согласие ПДн: чекбокс обязателен, фиксируется `consentAt`. **Чекбокс НЕ предзаполнять**
  (ФЗ-152). Ссылки на `/privacy` и `/offer`.
- После успеха — редирект на `/request-quote/status/[id]` (статус по ссылке, read-only, без логина).
- Редизайн: можно менять вид формы и статус-страницы; сохранить вызов action, чекбокс-согласие
  (не checked по умолчанию), редирект на статус по `result.requestId`.

### Оптовая заявка (`/wholesale`) — починена 2026-06-15
- Форма: `src/app/wholesale/page.tsx`. Server action: `src/app/wholesale/actions.ts` →
  `submitWholesaleLead` (валидация `validate-wholesale-input.ts`, запись `WholesaleLead` в БД,
  Telegram-уведомление). Видна в админке `/admin/wholesale`.
- Согласие ПДн: чекбокс обязателен, **НЕ предзаполнять** (ФЗ-152), ссылки на `/privacy` и `/offer`.
- Редизайн: можно менять вид формы; сохранить вызов action и чекбокс-согласие (не checked).
  **Не возвращать `setTimeout`-имитацию отправки** — это была форма-пустышка (см. антипаттерны).

### Уведомления (Telegram)
- `src/lib/notifications.ts`: `notifyNewQuoteRequest`, `notifyNewWholesaleLead` → общий `sendTelegram`.
- Env-зависимо: без `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` заявка сохраняется,
  а структурированный лог получает `notificationStatus: not_configured`.
  Сбой Telegram НЕ ломает сохранение заявки/лида.
- Редизайн: вёрстки не касается, но не убирать вызовы notify из server actions.

### Реквизиты и контакты
- Единый источник: `src/lib/company.ts`. Телефон/email/ИНН/ОГРН — только оттуда (правило 12 в CLAUDE.md).
- Юр-страницы: `/legal`, `/offer`, `/privacy`, `/terms`, `/returns`.
- Редизайн: не хардкодить контакты в новой вёрстке — тянуть из `COMPANY`.

### SEO-слой (легко снести при переписывании страниц)
- JSON-LD: `src/components/seo/product-jsonld.tsx` (`ProductJsonLd`, `OrganizationJsonLd`).
- `generateMetadata` на карточке товара и в каталоге (canonical, noindex на поиск).
- `sitemap.ts`, `robots.ts`. Редизайн: сохранить эти компоненты/функции на страницах.

### Админка
- `/admin` (auth по логину+паролю, constant-time), `/admin/requests`, `/admin/wholesale`, `/admin/products`.
- Server actions: `admin/actions.ts` → `updateRequestStatus`, `updateProductPricing`;
  `admin/login/actions.ts` → вход/`logoutAdmin`. UI: `status-select.tsx`, `pricing-row.tsx`.
- Редизайн: отдельная зона, **не смешивать со стилями витрины**; сохранить actions.

---

## Сводка точек интеграции (быстрый чек при переверстке)

- **Хуки:** `use-cart`, `use-compare`.
- **Сторы:** `compare-store`, `request-list-store` (адаптер над `electromagaz_cart`).
- **Server actions:** `submitQuoteRequest`, `submitWholesaleLead`, `fetchCompareProducts`,
  `updateRequestStatus`, `updateProductPricing`, вход/выход админа.
- **API routes:** `/api/search`, `/api/catalog/categories`, `/api/catalog/export`.
- **DOM-зацепки:** `data-cart-icon`, `data-add-to-cart-block`, URL-параметры каталога.

---

## Антипаттерны (НЕ повторять при редизайне)

- **Форма-имитация:** `<form>` с `handleSubmit`, который делает `setTimeout` →
  `setSubmitted(true)` без реальной отправки. Был грех в `wholesale` — **уже исправлен**,
  не возвращать. Любая форма, собирающая данные, должна слать их в action/API.
- **Сбор ПДн в никуда:** форма с именем/телефоном/email без отправки и/или без
  согласия — нарушение ФЗ-152 и потеря лида.
- **Хардкод контактов** в вёрстке вместо `COMPANY`.
- **Фейковые данные на UI:** номера/статусы через `Math.random`, ложные тексты
  («копия отправлена на email», когда email не шлётся). Уже вычищены — не возвращать.
- **Возврат фейкового ЛК/auth:** личный кабинет был клиентской бутафорией и вырезан.
  Реальный auth — Этап 4, отдельная фича. Не воссоздавать моками.
- **Недостоверная реклама:** см. долги — заявления о сертификации/стаже/объёме без
  подтверждения. Не тиражировать в новой вёрстке.

---

## Известные долги/находки (на 2026-06-15)

- ✅ **wholesale-форма — ПОЧИНЕНА** (2026-06-15): была пустышкой. Теперь `submitWholesaleLead`
  → БД (`WholesaleLead`) + Telegram + чекбокс согласия ПДн, видна в `/admin/wholesale`.
- **БЛОКЕР ПРОД-АНОНСА — заявления-заглушки** (отложено владельцем, НЕ выкатывать без правки):
  знак **РСТ** + «работаем по ГОСТ/техрегламентам ТС» (`footer.tsx`); «с {foundedYear}/с 2012 года»,
  «более 500 000 позиций», «НДС, сертификаты, ТРО» (`about/page.tsx`). До подтверждения
  документами — недостоверная реклама (риск ФАС). Заменить реальными или убрать перед запуском.
- **Дубль форм заявки**: `/request-quote` и `/request-list/submit` шлют один
  `submitQuoteRequest`. Поскольку cart и request-list — одно хранилище, это по сути одна
  фича в двух обёртках. Финал унифицирован (оба → `/request-quote/status/[id]`). Решить
  каноническую форму и убрать вторую — **удобный момент именно при редизайне**.
- **Telegram-бот**: токен и chat_id прописаны локально (`.env`), на проде нужны те же
  переменные в Vercel env, иначе уведомления молчат (заявки всё равно пишутся в БД).
- `logo.png` отсутствует (OrganizationJsonLd ссылается на него). См. `pending_production_data`.
- Реквизиты в `company.ts` — плейсхолдеры `[ЗАПОЛНИТЬ]`; добиться `hasPlaceholders() === false`
  перед прод-анонсом.

---

## Чек-лист после редизайна

- [ ] `npm run build` зелёный, `npm run lint` без новых ошибок
- [ ] Добавление в корзину анимируется (значит `data-cart-icon` на месте)
- [ ] Липкая панель добавления на карточке появляется при скролле (`data-add-to-cart-block`)
- [ ] Заявка на КП отправляется и ведёт на `/request-quote/status/[id]`
- [ ] Оптовая заявка (`/wholesale`) шлёт `submitWholesaleLead` (не `setTimeout`), видна в `/admin/wholesale`
- [ ] Чекбокс согласия ПДн НЕ предзаполнен (обе формы), ссылки на /privacy и /offer живые
- [ ] Поиск, мега-меню, сравнение (с лимитом 4) работают
- [ ] Ссылки каталога ведут на `/catalog?category=<slug>` (не на `/catalog/<slug>`)
- [ ] Контакты на страницах совпадают (тянутся из `company.ts`)
- [ ] JSON-LD и `generateMetadata` остались на товаре/каталоге
- [ ] Нет новых форм-пустышек (любая форма шлёт данные в action/API)
- [ ] Ссылки в футере (оферта/политика/реквизиты) и help ведут на реальные страницы
- [ ] localStorage-ключи (`electromagaz_cart`, `electromagaz:compare`) не переименованы
