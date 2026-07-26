# Перенос проекта и второго мозга в GitHub

## 1. Задача

Перенести Electromagaz из старого GitHub-remote в новый private-репозиторий `cyberjuke2077/magazik` и сделать versioned доступный второй мозг и parser/collector assets.

## 2. Как решали

Создали новый private-репозиторий, перевязали `origin`, переименовали текущую ветку в `main` и запушили существующую историю. Затем инвентаризировали ignored материалы, исключили секреты и runtime state, вернули legacy collector из истории Git и добавили правила Git workflow.

## 3. Результат

Частично: в индекс добавлены второй мозг, инструкции, Kiro specs, local project config, legacy collector source, tests и parsed CSV. До завершения остаются commit, push и проверка удалённых refs. Секреты, raw runtime-конфиг, SQLite DB, логи, кэши и database backups намеренно остаются вне Git.

## 4. Что можно было лучше

Первый secret-scan сломался из-за вложенных shell-кавычек. Проверку повторили безопасными отдельными regex-паттернами без вывода значений.

## 5. Изменения во втором мозге

Добавлен feedback `secret-scan-shell-quoting`. Добавлен `docs/github-workflow.md` с рабочим GitHub flow и границей между versioned source/documentation и локальными секретами/runtime-данными.
