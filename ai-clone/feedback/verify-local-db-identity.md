---
name: verify-local-db-identity
type: feedback
---
Не предполагать имя роли и базы локальной PostgreSQL, а читать только нужные
несекретные переменные `POSTGRES_USER` и `POSTGRES_DB`.

**Why:** проверочный `psql` был сначала запущен с пользователем из
`.env.example`, хотя фактический локальный `POSTGRES_USER` отличался.

**How to apply:** перед `docker exec ... psql` выполнить точечный grep двух
несекретных переменных, не читать `.env` целиком и не выводить пароль.
