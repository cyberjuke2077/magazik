---
name: verify-vercel-link-side-effects
type: feedback
---
Перед `vercel link` зафиксировать наличие локального `.env.local` и после команды проверить, не добавил ли CLI служебные переменные; содержимое и значения файла не выводить и не коммитить.

**Why:** Vercel CLI 58.5.1 при перелинковке проекта автоматически записал `VERCEL_OIDC_TOKEN` в игнорируемый `.env.local`, хотя задача касалась только Git-интеграции.

**How to apply:** при создании или перелинковке Vercel project, смене scope/team и повторной настройке checkout.
