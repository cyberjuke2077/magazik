---
name: avoid-top-level-await-temp-scripts
type: feedback
---
Временные TypeScript-скрипты, которые могут запускаться в CJS-контексте, должны оборачивать `await` в явную `async main()`.

**Why:** Диагностический скрипт с top-level `await` не запустился через текущий `tsx`/CJS pipeline и потребовал повторного прогона.

**How to apply:** Для одноразовых DB и runtime-проверок создавать `async function main()`, вызывать её с явным `catch` и выставлять `process.exitCode = 1` при ошибке.
