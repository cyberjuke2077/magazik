---
name: github-connector-private-repo-access
type: feedback
---
Перед созданием Pull Request через GitHub connector проверить доступ connector к private-репозиторию и при `404` перейти на `gh` только после проверки его авторизации.

**Why:** Git push в private-репозиторий работал, но GitHub connector не видел репозиторий и вернул `404`.

**How to apply:** использовать connector как основной путь; если он отвечает `404`, выполнить `gh --version` и `gh auth status`, затем применить `gh pr create` как fallback.
