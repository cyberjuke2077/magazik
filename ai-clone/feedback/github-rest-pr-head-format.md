---
name: github-rest-pr-head-format
type: feedback
---
Для Pull Request из ветки того же репозитория передавать в GitHub REST API поле `head` как имя ветки без префикса аккаунта.

**Why:** запрос с `head: 37Lunar:codex/test-commit` для ветки внутри `cyberjuke2077/magazik` вернул `422 Validation Failed`, а `head: codex/test-commit` создал Pull Request.

**How to apply:** перед вызовом `POST /repos/{owner}/{repo}/pulls` определить, находится ли исходная ветка в том же репозитории; использовать `branch` для того же репозитория и `owner:branch` только для fork.
