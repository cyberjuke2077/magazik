---
name: preserve-shared-supabase-project
type: feedback
---
Для общей Supabase-базы в чужой organization не использовать Vercel Marketplace provisioning или terms flow как recovery-путь без отдельного решения о миграции.

**Why:** production project `dbumwpnbtvixfusxnggn` уже принадлежит `37Lunar's Org` и используется двумя разработчиками, а агент дважды предложил Marketplace-путь, который мог создать отдельную organization или resource.

**How to apply:** При восстановлении Vercel env сначала подтвердить owner, organization и project ref, затем использовать external integration connection или ручные Production connection strings существующей базы.
