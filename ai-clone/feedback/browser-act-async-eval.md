---
name: browser-act-async-eval
type: feedback
---
Асинхронный код в `browser-act eval` оборачивать в async IIFE.

**Why:** BrowserAct 1.4.2 отклонил top-level `await fetch` с `SyntaxError`.

**How to apply:** для read-only fetch использовать форму
`(async () => { ... await fetch(...) ... })()` и после этого проверять результат.
