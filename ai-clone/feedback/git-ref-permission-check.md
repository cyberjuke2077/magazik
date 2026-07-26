---
name: git-ref-permission-check
type: feedback
---
Перед выводом о конфликте Git refs по ошибке `cannot lock ref` проверить существующие refs и права на `.git`.

**Why:** ограниченный sandbox не дал создать новую ветку, хотя ветки с конфликтующим именем не было.

**How to apply:** выполнить `git branch --list` и `git show-ref --heads`; если refs нет, повторить операцию с корректным разрешением вместо переименования или удаления веток.
