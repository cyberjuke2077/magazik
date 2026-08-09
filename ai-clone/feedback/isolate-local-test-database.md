---
name: isolate-local-test-database
type: feedback
---
Временную E2E-базу создавать только в локальном Docker PostgreSQL через `POSTGRES_DB` и `scripts/with-local-db.ts`, не изменяя путь в `.env` `DATABASE_URL`.

**Why:** попытка заменить только имя БД в `DATABASE_URL` сохранила удалённый Supabase host. Соединение не установилось и записи не произошло, но такой способ создаёт недопустимый риск для production.

**How to apply:** при изолированных миграциях, seed, E2E и любых тестах, где `.env` может содержать удалённый PostgreSQL URL.
