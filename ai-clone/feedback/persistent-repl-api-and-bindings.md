---
name: persistent-repl-api-and-bindings
type: feedback
---
В persistent node_repl использовать уникальные имена или `globalThis` и проверять
фактический API браузерной оболочки перед вызовом helper-методов.

**Why:** повторный `const` остановил QA-вызов, затем несуществующий метод ожидания
сорвал повторную попытку до выполнения проверки.

**How to apply:** при многошаговом браузерном QA не переобъявлять top-level
bindings, выводить данные через `nodeRepl.write` и не переносить API обычного
Playwright в обертку без проверки документации.
