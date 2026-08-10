---
name: playwright-update-snapshots-syntax
type: feedback
---
Для выборочного обновления visual baseline вызывать `playwright test <file> --update-snapshots=all`, а не передавать путь после npm-script с optional-флагом.

**Why:** npm-script `test:e2e:update` передал путь теста как значение `--update-snapshots` и Playwright завершился до запуска сценариев.

**How to apply:** когда нужно обновить baseline одного файла или grep-набора, использовать прямой вызов Playwright с явным значением `all`, `changed` или `missing`.
