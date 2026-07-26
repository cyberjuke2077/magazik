---
name: verify-browser-screenshot-file
type: feedback
---

После сохранения browser screenshot по `path` обязательно проверить существование и размеры файла через `ls` и `sips`.

**Why:** браузер вернул успешное сохранение и байты, но файл в host filesystem не появился.

**How to apply:** для финальных скриншотов проверять физический путь; при несовпадении экспортировать из подтвержденного Playwright baseline и кадрировать через `sharp`.
