# Legacy collector

Это восстановленный исходный код локального collector из исторического commit `29058b46f323e697d891428df14b461910515620` от 2026-05-28. Его удалили из основной рабочей директории в commit `7c43273`, но он нужен как воспроизводимый source asset для каталога.

## Граница

- Здесь только исходники и `requirements.txt`.
- Локальные credentials, `config.yaml`, SQLite progress DB, браузерные профили, логи и parsed runtime state не хранятся рядом с кодом.
- Конфиг collector создаётся локально по [config.example.yaml](../../config.example.yaml) и не коммитится.

Не подключай этот код обратно к production pipeline без отдельного аудита: основной enrichment теперь живёт в `src/lib/enrichment/`.
