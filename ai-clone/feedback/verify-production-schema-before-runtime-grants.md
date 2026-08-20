---
name: verify-production-schema-before-runtime-grants
type: feedback
---
Перед выдачей runtime-роли сверять реальные production-таблицы и историю Prisma migrations с репозиторием.

**Why:** первая попытка создать роль ссылалась на `SubmissionRateLimit` до проверки production schema. Транзакция откатилась, после чего обнаружилась отсутствующая миграция `20260731190000_add_submission_rate_limit`.

**How to apply:** Перед созданием роли, настройкой database env или production deploy сравнить таблицы и `_prisma_migrations` с versioned migrations, применить подтверждённый drift и только затем выдавать точечные GRANT.
