#!/usr/bin/env python3
"""
LEGACY recovery tool for images that are already stored in R2.

Новый pipeline не использует этот порядок. Для обычной обработки запускать
process_catalog_images.py: он очищает и проверяет изображение до загрузки в R2.

Поток на каждую картинку:
  1. читает ProductImage из Postgres (R2-hosted, ещё не -wmclean);
  2. скачивает по публичному R2 URL;
  3. Florence-2 находит watermark → LaMa зарисовывает (если найден);
  4. транскодит в WebP 600px и заливает в R2 под ключом <sha1>-wmclean.webp;
  5. обновляет ProductImage.imageUrl на новый URL.

Идемпотентно: картинки, уже оканчивающиеся на `-wmclean.webp`, пропускаются;
картинки без watermark тоже помечаются (-wmclean), чтобы повторный прогон их
не трогал. Безопасный предпросмотр через --dry-run.

Логику детекции/inpaint берём из remove_watermarks.py (Florence-2 + LaMa).

Запуск:
  # локально (Mac, CPU) — тест/малый объём
  .venv/bin/python clean_r2_watermarks.py --device cpu --limit 20 --dry-run
  .venv/bin/python clean_r2_watermarks.py --device cpu --limit 20

  # массово на сервере с GPU (RTX 2080 Ti)
  .venv/bin/python clean_r2_watermarks.py --device cuda
"""
from __future__ import annotations

import argparse
import hashlib
import io
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv
from PIL import Image

# Загружаем env из корня проекта (.env.local важнее .env).
_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT / ".env")
load_dotenv(_ROOT / ".env.local", override=True)

os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

# Функции модели — из соседнего скрипта.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from remove_watermarks import (  # noqa: E402
    load_florence,
    load_lama,
    pick_device,
    remove_all,
)

WMCLEAN_SUFFIX = "-wmclean.webp"
WEBP_WIDTH = 600
WEBP_QUALITY = 85


def env(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        print(f"ERROR: env {name} not set", file=sys.stderr)
        sys.exit(1)
    return v


def r2_client():
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=env("R2_ENDPOINT"),
        aws_access_key_id=env("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=env("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
    )


def cleaned_key(source_url: str) -> str:
    h = hashlib.sha1(source_url.encode()).hexdigest()
    return f"products/{h[:2]}/{h}{WMCLEAN_SUFFIX}"


def to_webp(image: Image.Image) -> bytes:
    img = image.convert("RGB")
    if img.width > WEBP_WIDTH:
        ratio = WEBP_WIDTH / img.width
        img = img.resize((WEBP_WIDTH, max(1, int(img.height * ratio))))
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=WEBP_QUALITY)
    return buf.getvalue()


def fetch_rows(conn, public_url: str, limit: int | None):
    sql = (
        'SELECT id, "imageUrl" FROM "ProductImage" '
        "WHERE \"imageUrl\" LIKE %s AND \"imageUrl\" NOT LIKE %s "
        'ORDER BY id'
    )
    params: list = [f"{public_url}%", f"%{WMCLEAN_SUFFIX}"]
    if limit is not None:
        sql += " LIMIT %s"
        params.append(limit)
    with conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def main() -> None:
    ap = argparse.ArgumentParser(description="Clean watermarks on R2-hosted ProductImages")
    ap.add_argument("--device", default="auto", choices=["auto", "cuda", "mps", "cpu"])
    ap.add_argument("--detection-prompt", default="watermark")
    ap.add_argument("--max-bbox-percent", type=float, default=12.0)
    ap.add_argument("--passes", type=int, default=2, help="раундов detect→inpaint (multi-watermark)")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--legacy-existing-r2",
        action="store_true",
        help="явно разрешить ремонт уже загруженных в R2 старых изображений",
    )
    args = ap.parse_args()

    if not args.dry_run and not args.legacy_existing_r2:
        print(
            "ERROR: legacy post-upload cleaning is disabled. "
            "Use process_catalog_images.py, or pass --legacy-existing-r2 "
            "only to repair old R2 objects.",
            file=sys.stderr,
        )
        sys.exit(2)

    import psycopg

    public_url = env("R2_PUBLIC_URL").rstrip("/")
    bucket = env("R2_BUCKET")
    device = pick_device(args.device)
    print(f"device: {device}")

    conn = psycopg.connect(env("DATABASE_URL"))
    rows = fetch_rows(conn, public_url, args.limit)
    print(f"candidates: {len(rows)}")
    if args.dry_run:
        for rid, url in rows[:20]:
            print(f"  {rid}  {url}")
        print("DRY RUN — no model run, no R2/DB writes")
        conn.close()
        return
    if not rows:
        conn.close()
        return

    print("loading Florence-2…")
    model, processor, dtype = load_florence(device)
    print("loading LaMa…")
    lama = load_lama(device)
    s3 = r2_client()

    cleaned = untouched = failed = 0
    for i, (rid, url) in enumerate(rows):
        prefix = f"[{i + 1}/{len(rows)}]"
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            image = Image.open(io.BytesIO(resp.content)).convert("RGB")

            image, drawn = remove_all(
                model, processor, device, dtype, lama, image,
                args.detection_prompt, args.max_bbox_percent, args.passes,
            )
            if drawn > 0:
                cleaned += 1
                status = f"removed {drawn}"
            else:
                untouched += 1
                status = "no watermark"

            key = cleaned_key(url)
            new_url = f"{public_url}/{key}"
            s3.put_object(
                Bucket=bucket,
                Key=key,
                Body=to_webp(image),
                ContentType="image/webp",
                CacheControl="public, max-age=31536000, immutable",
            )
            with conn.cursor() as cur:
                cur.execute(
                    'UPDATE "ProductImage" SET "imageUrl" = %s WHERE id = %s',
                    [new_url, rid],
                )
            conn.commit()
            print(f"{prefix} {status} → {new_url}")
        except Exception as e:  # noqa: BLE001
            conn.rollback()
            failed += 1
            print(f"{prefix} FAIL {url}: {e}")

    conn.close()
    print(f"\nTotal {len(rows)} | cleaned {cleaned} | untouched {untouched} | failed {failed}")


if __name__ == "__main__":
    main()
