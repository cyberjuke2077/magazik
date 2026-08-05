---
name: use-vercel-integration-env-names
type: feedback
---
Для Prisma на Vercel использовать env официальной Supabase integration напрямую через кодовый fallback, не копировать sensitive value между переменными в Dashboard.

**Why:** клик по `POSTGRES_PRISMA_URL` скопировал имя переменной, а не secret value; созданный `DATABASE_URL` содержал строку `POSTGRES_PRISMA_URL`, и Prisma отклонил ее как невалидный URL.

**How to apply:** при подключении Supabase Marketplace, ошибках Prisma datasource URL и настройке `DATABASE_URL` или `DIRECT_URL` в Vercel.
