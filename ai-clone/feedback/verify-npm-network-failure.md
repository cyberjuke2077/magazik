---
name: verify-npm-network-failure
type: feedback
---
Перед выводом, что `npm` завис, проверить последний debug-log и сетевые ошибки.

**Why:** сетевые retry с `ENOTFOUND` выглядели как зависание и зря съели время.

**How to apply:** при долгом `npm install` сначала проверить лог, затем при
заполненном cache перейти на `--offline` или запросить сетевой доступ.
