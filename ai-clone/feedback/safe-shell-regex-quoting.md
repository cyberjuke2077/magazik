---
name: safe-shell-regex-quoting
type: feedback
---
Не помещать backtick в double-quoted shell regex.

**Why:** zsh оборвал диагностическую команду с `unmatched "` до выполнения.

**How to apply:** использовать single quotes для regex или упростить поиск до
нескольких безопасных команд без shell-подстановок.
