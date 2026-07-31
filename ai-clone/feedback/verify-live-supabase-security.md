---
name: verify-live-supabase-security
type: feedback
---
Не считать RLS и политики Supabase настроенными по документации или словам разработчика - проверять живой проект через список таблиц, advisors, `pg_policies` и права ролей.

**Why:** 31 июля 2026 года ветка разработчика утверждала, что RLS включён, но в подключённом Supabase-проекте RLS был выключен на всех таблицах `public`, политик не было, а роли `anon` и `authenticated` имели полный набор табличных прав.

**How to apply:** перед merge, production-настройкой или заявлением о безопасности Supabase выполнить read-only аудит живого target environment и отдельно зафиксировать, какая это среда - integration или production.
