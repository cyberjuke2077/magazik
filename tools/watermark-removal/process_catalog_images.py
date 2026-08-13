#!/usr/bin/env python3
"""Clean candidate images locally and upload only approved WebP files to R2."""
from __future__ import annotations

import argparse
import hashlib
import io
import ipaddress
import json
import os
import socket
import sys
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlsplit, urlunsplit

import requests
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from PIL import Image

_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_ROOT / ".env")
load_dotenv(_ROOT / ".env.local", override=True)
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

sys.path.insert(0, str(Path(__file__).resolve().parent))
from remove_watermarks import (  # noqa: E402
    build_mask,
    detect_boxes,
    load_florence,
    load_lama,
    pick_device,
    remove_all,
)

MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000
WEBP_MAX_SIZE = 1000
WEBP_QUALITY = 84
BLUE_WM_MAX = 0.12
EDGE_BLUE_MAX = 0.04
REDIRECT_CODES = {301, 302, 303, 307, 308}
PRISMA_ONLY_QUERY_PARAMS = {"schema", "pgbouncer", "connection_limit", "pool_timeout"}
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"env {name} is not set")
    return value


def psycopg_url(value: str) -> str:
    parsed = urlsplit(value)
    query = [
        (key, item)
        for key, item in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in PRISMA_ONLY_QUERY_PARAMS
    ]
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))


def validate_public_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise ValueError("candidate URL must use http or https")
    if parsed.username or parsed.password:
        raise ValueError("candidate URL must not contain credentials")
    default_port = 443 if parsed.scheme == "https" else 80
    addresses = socket.getaddrinfo(parsed.hostname, parsed.port or default_port)
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            raise ValueError(f"candidate host resolves to non-public IP: {ip}")
    return value


def download_image(url: str) -> bytes:
    current = url
    for _ in range(4):
        validate_public_url(current)
        with requests.get(
            current,
            timeout=(10, 30),
            stream=True,
            allow_redirects=False,
            headers={"User-Agent": "electromagaz-media-worker/1.0"},
        ) as response:
            if response.status_code in REDIRECT_CODES:
                location = response.headers.get("location")
                if not location:
                    raise RuntimeError("redirect has no location")
                current = urljoin(current, location)
                continue
            response.raise_for_status()
            return read_limited_response(response)
    raise RuntimeError("too many redirects")


def read_limited_response(response: requests.Response) -> bytes:
    content_type = response.headers.get("content-type", "").lower()
    if content_type and not content_type.startswith("image/"):
        raise RuntimeError(f"unexpected content type: {content_type}")
    content = bytearray()
    for chunk in response.iter_content(64 * 1024):
        content.extend(chunk)
        if len(content) > MAX_DOWNLOAD_BYTES:
            raise RuntimeError(f"image exceeds {MAX_DOWNLOAD_BYTES} bytes")
    if not content:
        raise RuntimeError("empty image response")
    return bytes(content)


def open_rgb(raw: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(raw))
    image.load()
    if image.width * image.height > MAX_IMAGE_PIXELS:
        raise RuntimeError("decoded image is too large")
    if image.mode in ("RGBA", "LA"):
        background = Image.new("RGB", image.size, "white")
        background.paste(image, mask=image.getchannel("A"))
        return background
    return image.convert("RGB")


def blue_features(image: Image.Image) -> tuple[float, float]:
    sample = image.resize((64, 64)).convert("RGB")
    blue = edge_blue = edge_count = 0
    for y in range(64):
        for x in range(64):
            red, green, value = sample.getpixel((x, y))
            white = red > 235 and green > 235 and value > 235
            is_blue = value > 90 and value - red > 25 and value - green > 12 and not white
            blue += int(is_blue)
            on_edge = x < 8 or x >= 56 or y < 8 or y >= 56
            if on_edge:
                edge_count += 1
                edge_blue += int(is_blue)
    return blue / 4096, edge_blue / edge_count


def has_lcsc_blue_watermark(image: Image.Image) -> bool:
    blue, edge_blue = blue_features(image)
    return blue >= BLUE_WM_MAX or edge_blue >= EDGE_BLUE_MAX


def verify_no_watermark(model, processor, device, dtype, image, prompt, max_percent) -> None:
    boxes = detect_boxes(model, processor, device, dtype, image, prompt)
    _, remaining = build_mask(image, boxes, max_percent)
    if remaining > 0:
        raise RuntimeError(f"watermark remains after cleaning: {remaining} region(s)")
    if boxes:
        raise RuntimeError(
            f"unsafe watermark detection rejected: {len(boxes)} region(s)",
        )
    if has_lcsc_blue_watermark(image):
        raise RuntimeError("blue watermark or placeholder remains after cleaning")


def clean_candidate(models, image: Image.Image, args) -> tuple[Image.Image, int]:
    model, processor, dtype, lama = models
    result, removed = remove_all(
        model,
        processor,
        args.device_resolved,
        dtype,
        lama,
        image,
        args.detection_prompt,
        args.max_bbox_percent,
        args.passes,
    )
    verify_no_watermark(
        model,
        processor,
        args.device_resolved,
        dtype,
        result,
        args.detection_prompt,
        args.max_bbox_percent,
    )
    return result, removed


def to_webp(image: Image.Image) -> bytes:
    output = image.copy()
    output.thumbnail((WEBP_MAX_SIZE, WEBP_MAX_SIZE), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    output.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=6)
    return buffer.getvalue()


def storage_key(content: bytes) -> str:
    digest = hashlib.sha256(content).hexdigest()
    return f"products/{digest[:2]}/{digest}.webp"


def create_r2_client():
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=env("R2_ENDPOINT"),
        aws_access_key_id=env("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=env("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
    )


def upload_clean_image(client, bucket: str, public_base: str, content: bytes) -> str:
    key = storage_key(content)
    try:
        client.head_object(Bucket=bucket, Key=key)
    except ClientError as error:
        status = error.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        if status != 404:
            raise
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=content,
            ContentType="image/webp",
            CacheControl="public, max-age=31536000, immutable",
        )
    return f"{public_base.rstrip('/')}/{key}"


def fetch_products(conn, limit: int | None, retry_processing: bool):
    statuses = ["pending", "failed"]
    if retry_processing:
        statuses.append("processing")
    sql = """
        SELECT id, "partNumber", "enrichmentMeta"
        FROM "Product"
        WHERE jsonb_typeof("enrichmentMeta"->'imageCandidates') = 'array'
          AND jsonb_array_length("enrichmentMeta"->'imageCandidates') > 0
          AND COALESCE("enrichmentMeta"->'imagePipeline'->>'status', 'pending') = ANY(%s)
        ORDER BY id
    """
    params: list[object] = [statuses]
    if limit is not None:
        sql += " LIMIT %s"
        params.append(limit)
    with conn.cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.fetchall()


def update_meta(conn, product_id: str, meta: dict) -> None:
    from psycopg.types.json import Jsonb
    with conn.cursor() as cursor:
        cursor.execute(
            'UPDATE "Product" SET "enrichmentMeta" = %s WHERE id = %s',
            [Jsonb(meta), product_id],
        )
    conn.commit()


def mark_processing(conn, product_id: str, meta: dict) -> dict:
    updated = deepcopy(meta)
    state = dict(updated.get("imagePipeline") or {})
    state.update({"status": "processing", "startedAt": utc_now()})
    state.pop("error", None)
    updated["imagePipeline"] = state
    update_meta(conn, product_id, updated)
    return updated


def mark_failed(conn, product_id: str, meta: dict, error: str) -> None:
    updated = deepcopy(meta)
    state = dict(updated.get("imagePipeline") or {})
    state.update({"status": "failed", "error": error[:500]})
    updated["imagePipeline"] = state
    update_meta(conn, product_id, updated)


def finalize_product(conn, product_id: str, part_number: str, meta: dict, images: list[dict]) -> None:
    from psycopg.types.json import Jsonb
    updated = deepcopy(meta)
    updated.pop("imageCandidates", None)
    updated["images"] = {"source": images[0]["source"], "fetchedAt": utc_now()}
    state = dict(updated.get("imagePipeline") or {})
    state.update({
        "status": "complete",
        "completedAt": utc_now(),
        "uploaded": len(images),
        "cleaned": sum(item["removed"] > 0 for item in images),
    })
    state.pop("error", None)
    updated["imagePipeline"] = state
    with conn.cursor() as cursor:
        cursor.execute('DELETE FROM "ProductImage" WHERE "productId" = %s', [product_id])
        for order, image in enumerate(images):
            cursor.execute(
                'INSERT INTO "ProductImage" '
                '(id, "imageUrl", "altText", "order", "productId", "createdAt") '
                'VALUES (%s, %s, %s, %s, %s, NOW())',
                [uuid.uuid4().hex, image["url"], f"Изображение товара {part_number}", order, product_id],
            )
        cursor.execute(
            'UPDATE "Product" SET "enrichmentMeta" = %s WHERE id = %s',
            [Jsonb(updated), product_id],
        )
    conn.commit()


def process_candidate(candidate: dict, models, args, r2) -> dict:
    source = candidate.get("source")
    url = candidate.get("url")
    if source not in ("chipdip", "lcsc", "mouser") or not isinstance(url, str):
        raise ValueError("invalid image candidate")
    raw = download_image(url)
    image = open_rgb(raw)
    if source == "lcsc" and has_lcsc_blue_watermark(image):
        raise RuntimeError("LCSC watermark or placeholder rejected")
    cleaned, removed = clean_candidate(models, image, args)
    content = to_webp(cleaned)
    public_url = upload_clean_image(r2[0], r2[1], r2[2], content)
    return {"url": public_url, "source": source, "removed": removed}


def run_local_pilot(rows, models, args, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    processed = 0
    for _, part_number, meta in rows:
        for candidate in (meta or {}).get("imageCandidates") or []:
            source = candidate.get("source")
            url = candidate.get("url")
            if source not in ("chipdip", "lcsc", "mouser") or not isinstance(url, str):
                continue
            raw = download_image(url)
            image = open_rgb(raw)
            if source == "lcsc" and has_lcsc_blue_watermark(image):
                continue
            cleaned, removed = clean_candidate(models, image, args)
            content = to_webp(cleaned)
            name = f"{hashlib.sha256(content).hexdigest()}.webp"
            (output_dir / name).write_bytes(content)
            print(f"  {part_number}: {source}, removed={removed}, output={name}")
            processed += 1
            break
    print(f"LOCAL PILOT - processed {processed}, no R2 or database writes")


def process_product(conn, row, models, args, r2) -> tuple[bool, int]:
    product_id, part_number, original_meta = row
    meta = mark_processing(conn, product_id, original_meta or {})
    candidates = meta.get("imageCandidates") or []
    approved: list[dict] = []
    errors: list[str] = []
    for candidate in candidates:
        if len(approved) >= args.max_images:
            break
        try:
            approved.append(process_candidate(candidate, models, args, r2))
        except Exception as error:  # noqa: BLE001
            host = urlparse(str(candidate.get("url", ""))).hostname or "invalid-url"
            errors.append(f"{host}: {error}")
    if not approved:
        mark_failed(conn, product_id, meta, "; ".join(errors) or "no valid image candidates")
        return False, 0
    finalize_product(conn, product_id, part_number, meta, approved)
    return True, sum(image["removed"] > 0 for image in approved)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Clean queued product images locally and upload approved WebP files to R2",
    )
    parser.add_argument("--device", default="auto", choices=["auto", "cuda", "mps", "cpu"])
    parser.add_argument("--detection-prompt", default="watermark")
    parser.add_argument("--max-bbox-percent", type=float, default=12.0)
    parser.add_argument("--passes", type=int, default=3)
    parser.add_argument("--max-images", type=int, default=1)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--retry-processing", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--local-output",
        type=Path,
        help="очистить кандидаты в локальную папку без R2 и записей в БД",
    )
    return parser.parse_args()


def main() -> None:
    import psycopg
    args = parse_args()
    if args.max_images < 1 or args.max_images > 10:
        raise RuntimeError("--max-images must be between 1 and 10")
    conn = psycopg.connect(psycopg_url(env("DATABASE_URL")))
    rows = fetch_products(conn, args.limit, args.retry_processing)
    print(f"products with pending images: {len(rows)}")
    if args.dry_run:
        for _, part_number, meta in rows[:20]:
            print(f"  {part_number}: {len((meta or {}).get('imageCandidates') or [])} candidate(s)")
        print("DRY RUN - no model, R2 or database writes")
        conn.close()
        return
    args.device_resolved = pick_device(args.device)
    print(f"device: {args.device_resolved}")
    model, processor, dtype = load_florence(args.device_resolved)
    lama = load_lama(args.device_resolved)
    models = (model, processor, dtype, lama)
    if args.local_output:
        run_local_pilot(rows, models, args, args.local_output)
        conn.close()
        return
    r2 = (create_r2_client(), env("R2_BUCKET"), env("R2_PUBLIC_URL"))
    completed = failed = cleaned = 0
    for index, row in enumerate(rows, start=1):
        try:
            ok, cleaned_count = process_product(conn, row, models, args, r2)
            completed += int(ok)
            failed += int(not ok)
            cleaned += cleaned_count
            print(f"[{index}/{len(rows)}] {row[1]}: {'complete' if ok else 'failed'}")
        except Exception as error:  # noqa: BLE001
            conn.rollback()
            failed += 1
            print(f"[{index}/{len(rows)}] {row[1]}: fatal: {error}")
    conn.close()
    print(json.dumps({"completed": completed, "failed": failed, "cleaned": cleaned}))


if __name__ == "__main__":
    main()
