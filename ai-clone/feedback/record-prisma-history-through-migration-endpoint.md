---
name: record-prisma-history-through-migration-endpoint
type: feedback
---
При ручном применении production migration записывать `_prisma_migrations` через разрешённый migration endpoint в том же контролируемом workflow.

**Why:** Supabase `execute_sql` выполнялся в read-only transaction и отклонил INSERT в Prisma history после успешного DDL.

**How to apply:** До применения посчитать SHA-256 versioned `migration.sql`, применить DDL через Supabase migration endpoint и тем же типом операции записать migration name, checksum и applied steps, затем проверить запись read-only запросом.
