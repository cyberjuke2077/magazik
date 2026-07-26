---
name: no-any-typescript
type: feedback
---
Никогда any в TypeScript. Если edge-case - unknown + type guard.

**Why:** any это дыра в типах. Компилятор перестаёт проверять именно там где чаще всего падает прод.

**How to apply:** любое место где хочется написать any - написать unknown и добавить type guard функцию.
