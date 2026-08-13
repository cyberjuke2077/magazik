# Watermark Removal (Florence-2 + LaMa)

Батч-удаление watermark **любого цвета и в любом месте**: Florence-2
находит знак по смыслу (open-vocabulary detection), LaMa аккуратно
зарисовывает область (реальный inpaint, не закраска).

Логика детекции/inpaint основана на [D-Ogi/WatermarkRemover-AI](https://github.com/D-Ogi/WatermarkRemover-AI) (MIT).
LaMa подключён через `simple-lama-inpainting` (без version-конфликтов iopaint).

## Установка

Требуется [`uv`](https://github.com/astral-sh/uv).

```bash
cd tools/watermark-removal
uv venv --python 3.11
uv pip install -r requirements.txt
```

На сервере с NVIDIA (например RTX 2080 Ti, Windows/Linux) — поставить
CUDA-сборку torch ДО requirements:

```bash
uv pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
uv pip install -r requirements.txt
```

## Запуск

```bash
# тест на нескольких картинках (Mac, CPU — медленно, но качество то же)
.venv/bin/python remove_watermarks.py --input ./in --output ./out --limit 10

# только детекция (без inpaint) — посмотреть, что находит Florence-2
.venv/bin/python remove_watermarks.py --input ./in --output ./out --dry-run

# массовый прогон на GPU
.venv/bin/python remove_watermarks.py --input ./in --output ./out --device cuda
```

Устройство выбирается автоматически: `cuda → mps → cpu`. Качество от
устройства НЕ зависит, только скорость:
- 2080 Ti (cuda): ~0.5–1.5 сек/картинка;
- Mac (cpu): ~5–15 сек/картинка.

## Опции

| Флаг | Назначение | Default |
|---|---|---|
| `--input` | папка или файл | — |
| `--output` | папка результатов | — |
| `--device` | `auto`/`cuda`/`mps`/`cpu` | `auto` |
| `--detection-prompt` | что искать | `watermark` |
| `--max-bbox-percent` | игнор боксов крупнее N% (анти-ложные) | `12` |
| `--limit` | обработать первые N (тест) | все |
| `--overwrite` | перезаписывать выход | нет |
| `--dry-run` | только детекция | нет |

## Поведение

- watermark не найден → картинка копируется как есть (фото не портится);
- найден → область зарисовывается LaMa, результат сохраняется в PNG.

## Интеграция с каталогом: `process_catalog_images.py`

Enrichment сохраняет в `Product.enrichmentMeta.imageCandidates` только URL
кандидатов. Бинарные изображения в PostgreSQL не пишутся. Worker скачивает
кандидат локально, удаляет watermark, повторно проверяет результат, конвертирует
его в WebP и только после этого загружает в R2.

Старый порядок `upstream -> R2 -> очистка` запрещён: он оставлял в bucket
неочищенные оригиналы и требовал второй проход по опубликованным данным.

```bash
# предпросмотр: что будет обработано (без запуска модели и записей)
.venv/bin/python process_catalog_images.py --limit 20 --dry-run

# локальный прогон малого объёма (Mac, CPU)
.venv/bin/python process_catalog_images.py --device auto --limit 10
```

При успехе worker атомарно заменяет `ProductImage`, удаляет очередь кандидатов
и ставит `imagePipeline.status=complete`. При ошибке кандидаты сохраняются,
статус становится `failed`, поэтому запуск можно повторить. По умолчанию
сохраняется одно главное изображение на товар. Берёт `DATABASE_URL` и `R2_*`
из `.env.local`/`.env` корня проекта.

## Массовый прогон на RTX 2080 Ti (Windows)

На своём ПК с 2080 Ti весь каталог чистится за часы и бесплатно.

```powershell
# 1. поставить uv (один раз): https://github.com/astral-sh/uv
# 2. в папке tools/watermark-removal:
uv venv --python 3.11
.venv\Scripts\activate

# 3. CUDA-сборка torch ДО остальных зависимостей:
uv pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
uv pip install -r requirements.txt

# 4. создать .env.local с DATABASE_URL и R2_* (как на основной машине)
#    DATABASE_URL должен указывать на ту же БД (Postgres доступен по сети).

# 5. массовый прогон на GPU:
python process_catalog_images.py --device cuda --passes 3
```

`--passes N` — сколько раундов detect→inpaint на картинку (default 3).
Florence-2 за проход находит один знак; 2+ прохода снимают множественные
watermark (например два логотипа на одном фото).

Скрипт коммитит каждый товар отдельной транзакцией - прогон можно
прерывать и возобновлять, уже обработанные позиции не попадают в очередь.
Скорость на 2080 Ti ~0.5–1.5 сек/картинка.

> Примечание: БД (Postgres) и R2 — общие для Mac и Windows-ПК, поэтому
> результат прогона на 2080 Ti сразу виден в магазине. Если Postgres
> локальный — открыть его по сети или временно поднять туннель.
