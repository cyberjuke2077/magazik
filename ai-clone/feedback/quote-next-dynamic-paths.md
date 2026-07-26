---
name: quote-next-dynamic-paths
type: feedback
---
Пути Next.js с квадратными скобками всегда передавать shell в одинарных кавычках.

**Why:** zsh трактовал `[slug]` как glob и команда падала до чтения файла.

**How to apply:** Любая shell-команда с путем вида `app/product/[slug]/page.tsx` должна
получать весь путь в одинарных кавычках.
