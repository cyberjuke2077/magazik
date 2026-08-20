---
name: use-webpack-when-turbopack-port-is-blocked
type: feedback
---
Если локальный Next.js build падает только на Turbopack `binding to a port: Operation not permitted`, повторять production-компиляцию с `next build --webpack`.

**Why:** sandbox запретил Turbopack создать служебный процесс и открыть порт при обработке CSS, хотя Webpack build и реальный Vercel deployment завершились успешно.

**How to apply:** В отчёте разделять sandbox failure и ошибку приложения, сохранять исходный вывод, запускать Webpack build и проверять реальный Vercel Production.
