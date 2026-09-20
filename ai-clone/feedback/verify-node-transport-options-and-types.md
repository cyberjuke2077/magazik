---
name: verify-node-transport-options-and-types
type: feedback
---
При изменении Node HTTPS transport отдельно сверять документацию runtime и установленные @types/node.

**Why:** поддерживаемый autoSelectFamily отсутствовал в RequestOptions, а тип SNI допускает null; первоначальный TypeScript-прогон нашёл обе ошибки.

**How to apply:** читать определения конкретных опций, задавать узкое пересечение для подтверждённой runtime-опции, не обходить ошибку через any. Проверять настоящий TLS отдельно от mocks.
