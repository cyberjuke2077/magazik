---
name: verify-playwright-assertion-options
type: feedback
---
Проверять параметры screenshot assertions по установленным типам до обновления эталонов.

**Why:** в `toHaveScreenshot` был передан параметр `style` от другого API;
браузерные тесты его проигнорировали, а TypeScript нашёл ошибку. Dev-индикатор
остался на снимках, потребовалось повторное обновление.

**How to apply:** для CSS в `toHaveScreenshot` использовать поддерживаемый
`stylePath`, запустить TypeScript и посмотреть реальный PNG. Зелёный screenshot
тест не подтверждает, что каждый неизвестный параметр был применён.
