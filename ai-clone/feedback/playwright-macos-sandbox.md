---
name: playwright-macos-sandbox
type: feedback
---
Для интерактивной проверки Chromium в managed macOS sandbox использовать
Playwright MCP или разрешенный CLI, а не прямой запуск браузера из Node REPL.
BrowserAct не использовать, если владелец проекта не запросил его явно.

**Why:** Chromium из Node REPL завершился системным запретом
`MachPortRendezvousServer`, хотя Playwright MCP и разрешенный CLI работали.

**How to apply:** при visual QA локального сайта на macOS сначала использовать
Playwright MCP; для полноразмерных файловых скриншотов использовать разрешенный
`npx playwright screenshot`. Наличие URL в задаче само по себе не является
основанием запускать BrowserAct.
