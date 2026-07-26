---
name: verify-hidden-file-search
type: feedback
---
Перед выводом об отсутствии dotfile проверяй его через `test -f` или `git ls-files`, а не только через поиск файлов.

**Why:** поиск пропустил существующий `.env.example`, что привело к ложному выводу о пробеле в onboarding.

**How to apply:** для `.env.example`, `.gitignore`, `.codex` и других hidden paths сначала используй точечную проверку существования, затем читай или редактируй файл.
