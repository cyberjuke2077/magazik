---
name: verify-vercel-project-identity
type: feedback
---
Перед созданием или перелинковкой Vercel project подтвердить исходный project ID, team, Git repository, env, domains и deployment history; `403` не является разрешением создать пустой project с тем же именем.

**Why:** вместо смены Git repository у существующего `electromagaz` был создан новый пустой project в другой team, поэтому старые env, domain и deployment history остались на прежнем target.

**How to apply:** при GitHub migration, смене repository owner/name, `vercel link`, `vercel git connect` и восстановлении checkout по старому `.vercel/project.json`.
