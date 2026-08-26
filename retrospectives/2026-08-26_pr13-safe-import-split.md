# Безопасное разбиение PR #13

## 1. Задача

Продолжить проект с точки прошлого handoff, не сливать конфликтующий draft PR #13
целиком и подготовить безопасную основу для следующей работы с парсером.

## 2. Как решали

- Сверили актуальные Git refs и состояние PR #13 на GitHub.
- Подтвердили, что PR #13 конфликтует с `main` и смешивает 20 коммитов, 96 файлов
  и несколько независимых задач.
- Создали ветку `codex/split-pr13-enrichment` от свежего `main`.
- Перенесли только MPN-only importer и ранний input-only dry-run.
- Добавили поддержку английских, русских и китайских заголовков, GB18030 CSV и
  безопасное распознавание package/date code.
- Убрали обязательный `DATABASE_URL` для dry-run и подтвердили запуск с пустыми
  database env без обращения к БД или внешним источникам.
- Прошли 262 unit-теста, lint, TypeScript и production build через Webpack.
- Открыли PR #17, дождались Vercel checks и слили merge-коммитом `71381a6`.
- Проверили deployment `FLnRR4ZaPMsqxWAuLjgds85AyWYc` через GitHub status и
  публичный BrowserAct smoke.

## 3. Результат: да

MPN importer/dry-run находится в `main`. Production отвечает HTTP 200 на root,
catalog, health, categories, карточке товара и CSV export. Каталог показывает 51
позицию, health подтверждает `database: ok`. Реальная запись enrichment, R2 и
`db:publish` не выполнялись.

## 4. Что можно было лучше

- Сразу выполнить `browser-act --help` после обновления CLI. Проверки одной версии
  недостаточно: команда `browser real open` отсутствует и в 1.4.2.
- Не запускать четыре `stealth-extract` параллельно до проверки BrowserAct auth.
  Публичный smoke не требует BrowserAct API key, если доступен чистый local Chrome
  profile.

## 5. Изменения во втором мозге

- План дополнен merge SHA, deployment и точной parser/enrichment точкой продолжения.
- Service inventory обновлён состоянием GitHub и текущего Vercel target.
- Live metrics обновлён подтверждённым публичным snapshot.
- Усилено существующее правило проверки фактического BrowserAct CLI `--help`.
