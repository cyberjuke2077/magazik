---
name: use-task-local-npm-cache
type: feedback
---
При `EACCES` в `~/.npm/_cacache` не менять владельца всего npm cache через sudo, а запускать одноразовый CLI с task-local `npm_config_cache` в `/private/tmp`.

**Why:** Vercel CLI не стартовал из-за старых root-owned файлов глобального npm cache, хотя системная правка прав не требовалась.

**How to apply:** Для разовой диагностики `npx` повторить команду через явный task-local cache. Глобальные права чинить только отдельной задачей после проверки владельца файлов.
