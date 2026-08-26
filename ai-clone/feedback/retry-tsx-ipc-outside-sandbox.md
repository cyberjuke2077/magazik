---
name: retry-tsx-ipc-outside-sandbox
type: feedback
---
При `tsx` с `listen EPERM` повторять ту же безопасную команду вне sandbox.

**Why:** input-only dry-run упал до импорта файлов, потому что sandbox запретил
создание локального IPC pipe.

**How to apply:** не менять код и аргументы, сохранить пустой `DATABASE_URL` и
запросить запуск только нужной dry-run команды вне sandbox.
