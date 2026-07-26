# Developer onboarding и безопасный локальный запуск

## 1. Задача

Подготовить подробную инструкцию, чтобы соразработчик мог клонировать Electromagaz, поднять локальную среду, работать с Codex и не зависеть от чужого `.env`.

## 2. Как решали

Сверили реальные npm scripts, Docker Compose, Prisma schema, env-переменные и правила публикации. Добавили подробный onboarding, обновили `.env.example`, исправили имя переменной `PUBLISH_DATABASE_URL` в старой инструкции и описали границы production access.

## 3. Результат

Да: новый разработчик получает воспроизводимый local flow с Docker PostgreSQL, Prisma и Codex context. Production keys, полный production-каталог и доступы к внешним сервисам остаются отдельной процедурой, а не частью Git.

## 4. Что можно было лучше

Первичный поиск не увидел существующий `.env.example` из-за hidden filename. Вывод исправлен до изменения шаблона, добавлено правило точечной проверки dotfiles.

## 5. Изменения во втором мозге

Добавлены `docs/developer-onboarding.md` и feedback `verify-hidden-file-search`. Уточнена инструкция публикации: используется `PUBLISH_DATABASE_URL`.
