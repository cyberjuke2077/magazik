---
name: isolate-test-runners
type: feedback
---
При добавлении нового test runner сразу исключать его каталоги из конфигураций остальных runner-ов.

**Why:** Vitest попытался исполнить Playwright `test.describe` после добавления e2e-контура.

**How to apply:** При добавлении Playwright, Vitest или другого runner-а проверить `include`
и `exclude` всех существующих тестовых конфигураций до первого общего прогона.
