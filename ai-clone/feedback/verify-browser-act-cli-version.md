---
name: verify-browser-act-cli-version
type: feedback
---
Перед первым BrowserAct-вызовом сверять установленную версию и фактический `--help`,
а перед созданием профиля проверять `browser list` и лимиты типа профиля.

**Why:** инструкция для BrowserAct 1.1 предложила `browser real open`, которого нет
в установленном CLI 1.2.2. Затем попытка создать второй `chrome-direct` профиль
уперлась в лимит одного профиля этого типа.

**How to apply:** при каждом новом BrowserAct task сначала выполнить
`browser-act --version`, `browser-act --help` и `browser-act browser list`, затем
выбрать поддерживаемую команду и изолированный профиль без чужих логинов.
