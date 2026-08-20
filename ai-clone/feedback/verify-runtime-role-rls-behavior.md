---
name: verify-runtime-role-rls-behavior
type: feedback
---
Проверять runtime-роль запросом реальных application-строк, а не только `SELECT 1` или успешным подключением.

**Why:** `electromagaz_app` успешно подключалась и `/api/health` возвращал `database: ok`, но включённый RLS без policies тихо фильтровал весь каталог до пустого результата.

**How to apply:** После создания роли проверить grants, `rolbypassrls`, `pg_policies`, количество доступных строк через production API и наличие известных товаров в отрисованном каталоге.
