---
name: verify-react-error-boundary-in-browser
type: feedback
---
Проверяй Next.js и React error boundary в реально отрисованном браузере, а не только по HTTP-статусу или сырому HTML.

**Why:** production-запрос каталога с недоступной БД вернул потоковый HTTP 200 без текста клиентского error boundary, хотя Chromium корректно показал нейтральную страницу ошибки.

**How to apply:** при проверке аварийных UI-состояний дождаться hydration в Chromium, проверить видимый текст и отдельно убедиться, что DOM не содержит адрес БД, Prisma-код или внутреннее сообщение.
