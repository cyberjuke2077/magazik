---
name: install-vercel-integration-before-supabase-link
type: feedback
---
Для подключения существующего Supabase project сначала установить team-level integration на стороне Vercel через `integration accept-terms`, и только потом связывать project в Supabase Dashboard.

**Why:** агент сразу отправил владельца в Supabase Dashboard, хотя в Vercel team не было ни одной Marketplace installation, поэтому Supabase сообщил, что Vercel project не найден.

**How to apply:** При пересоздании Vercel project сначала проверить `vercel integration installations`; не запускать `vercel integration add supabase`, потому что она создаёт новый database resource.
