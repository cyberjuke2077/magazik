---
name: git-add-named-only
type: feedback
---
git add только поимённо. Никогда git add . или git add -A.

**Why:** git add . утащил в коммит .env.local и сгенерированные файлы. Час на откат и смену ключей.

**How to apply:** перед каждым git add думать какие именно файлы нужны в этом коммите.
