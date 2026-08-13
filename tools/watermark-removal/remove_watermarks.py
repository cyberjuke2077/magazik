#!/usr/bin/env python3
"""
Batch watermark removal: Florence-2 (детекция) + LaMa (inpainting).

Удаляет подтвержденный watermark ChipDip в правой нижней части изображения.
Florence-2 предлагает область, защитные фильтры отсекают опасные ложные
детекты, а LaMa зарисовывает только прошедшую проверку область.

Логика детекции/inpaint основана на проекте D-Ogi/WatermarkRemover-AI (MIT).

Устройство выбирается автоматически:
  cuda (NVIDIA, напр. 2080 Ti на Windows) → mps (Apple Silicon) → cpu.
Качество от устройства НЕ зависит — только скорость.

Использование:
  # тест на нескольких картинках (Mac, CPU)
  python remove_watermarks.py --input ./in --output ./out --limit 10

  # массовый прогон на сервере с GPU
  python remove_watermarks.py --input ./in --output ./out --device cuda

Опции:
  --input PATH         папка с картинками или один файл
  --output PATH        папка для результатов (создаётся)
  --device auto|cuda|mps|cpu   (default auto)
  --detection-prompt   что искать (default "watermark")
  --max-bbox-percent   игнорировать боксы крупнее N% площади (default 12)
  --limit N            обработать только первые N (для теста)
  --overwrite          перезаписывать существующие выходные файлы
  --dry-run            только детекция: печатать найденные боксы, не inpaint
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Разрешаем MPS падать на CPU для неподдержанных операций (Apple Silicon).
os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
MIN_CENTER_X_RATIO = 0.65
MIN_CENTER_Y_RATIO = 0.60
MIN_LIGHT_PIXEL_RATIO = 0.80
LIGHT_PIXEL_THRESHOLD = 160


def pick_device(requested: str) -> str:
    import torch

    if requested != "auto":
        return requested
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_florence(device: str):
    """Грузит Florence-2-large + processor.

    Используем НАТИВНЫЙ класс transformers (Florence2ForConditionalGeneration)
    и community-mirror весов — старый remote_code от microsoft несовместим
    со свежими transformers (ломается на forced_bos_token_id).
    """
    import torch
    from transformers import AutoProcessor, Florence2ForConditionalGeneration

    model_id = "florence-community/Florence-2-large"
    dtype = torch.float32 if device in ("cpu", "mps") else torch.float16
    model = Florence2ForConditionalGeneration.from_pretrained(
        model_id, torch_dtype=dtype
    ).to(device)
    processor = AutoProcessor.from_pretrained(model_id)
    model.eval()
    return model, processor, dtype


def detect_boxes(model, processor, device, dtype, image, prompt: str):
    """Open-vocabulary detection: возвращает список bbox [x1,y1,x2,y2]."""
    import torch

    task = "<OPEN_VOCABULARY_DETECTION>"
    text = task + prompt
    inputs = processor(text=text, images=image, return_tensors="pt")
    input_ids = inputs["input_ids"].to(device)
    pixel_values = inputs["pixel_values"].to(device, dtype)

    with torch.no_grad():
        generated_ids = model.generate(
            input_ids=input_ids,
            pixel_values=pixel_values,
            max_new_tokens=1024,
            num_beams=3,
            do_sample=False,
        )
    text_out = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
    parsed = processor.post_process_generation(
        text_out, task=task, image_size=(image.width, image.height)
    )
    result = parsed.get(task, {})
    return result.get("bboxes", []) or []


def light_pixel_ratio(image, box) -> float:
    """Доля светлых пикселей внутри bbox предполагаемой белой подписи."""
    x1, y1, x2, y2 = [int(v) for v in box]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(image.width, x2), min(image.height, y2)
    if x2 <= x1 or y2 <= y1:
        return 0.0
    gray = image.crop((x1, y1, x2, y2)).convert("L")
    histogram = gray.histogram()
    light = sum(histogram[LIGHT_PIXEL_THRESHOLD:])
    return light / (gray.width * gray.height)


def is_safe_chipdip_box(image, box, max_bbox_percent: float) -> bool:
    """Разрешает inpaint только для проверенного паттерна watermark ChipDip."""
    x1, y1, x2, y2 = [int(v) for v in box]
    width = max(0, x2 - x1)
    height = max(0, y2 - y1)
    total = image.width * image.height
    if not total or not width or not height:
        return False
    if (width * height / total) * 100 > max_bbox_percent:
        return False
    center_x = (x1 + x2) / (2 * image.width)
    center_y = (y1 + y2) / (2 * image.height)
    if center_x < MIN_CENTER_X_RATIO or center_y < MIN_CENTER_Y_RATIO:
        return False
    return light_pixel_ratio(image, box) >= MIN_LIGHT_PIXEL_RATIO


def build_mask(image, boxes, max_bbox_percent: float):
    """Маска только для безопасных bbox watermark ChipDip."""
    from PIL import Image, ImageDraw

    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    drawn = 0
    for box in boxes:
        if not is_safe_chipdip_box(image, box, max_bbox_percent):
            continue
        x1, y1, x2, y2 = [int(v) for v in box]
        # небольшое расширение, чтобы захватить кромку текста
        pad = 3
        draw.rectangle([x1 - pad, y1 - pad, x2 + pad, y2 + pad], fill=255)
        drawn += 1
    return mask, drawn


def load_lama(device: str):
    """LaMa через simple-lama-inpainting (модель big-lama тянется с HF)."""
    import torch
    from simple_lama_inpainting import SimpleLama

    return SimpleLama(device=torch.device(device))


def inpaint(lama, image, mask):
    """image: PIL RGB, mask: PIL 'L' (белое = удалить) → PIL RGB."""
    # SimpleLama бинаризует маску внутри; на выходе PIL RGB.
    return lama(image, mask.convert("L")).convert("RGB")


def remove_all(model, processor, device, dtype, lama, image, prompt, max_bbox_percent, passes=2):
    """Итеративно убирает watermark: несколько раундов detect→inpaint,
    чтобы снять множественные знаки (Florence-2 за проход даёт 1 бокс).
    Возвращает (очищенное_изображение, всего_убрано_регионов)."""
    total = 0
    for _ in range(max(1, passes)):
        boxes = detect_boxes(model, processor, device, dtype, image, prompt)
        mask, drawn = build_mask(image, boxes, max_bbox_percent)
        if drawn == 0:
            break
        image = inpaint(lama, image, mask)
        total += drawn
    return image, total


def iter_images(input_path: Path, limit: int | None):
    if input_path.is_file():
        yield input_path
        return
    files = sorted(p for p in input_path.iterdir() if p.suffix.lower() in IMAGE_EXTS)
    for i, p in enumerate(files):
        if limit is not None and i >= limit:
            break
        yield p


def main() -> None:
    ap = argparse.ArgumentParser(description="Florence-2 + LaMa watermark removal")
    ap.add_argument("--input", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--device", default="auto", choices=["auto", "cuda", "mps", "cpu"])
    ap.add_argument("--detection-prompt", default="watermark")
    ap.add_argument("--max-bbox-percent", type=float, default=12.0)
    ap.add_argument("--passes", type=int, default=2, help="раундов detect→inpaint (multi-watermark)")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    from PIL import Image

    device = pick_device(args.device)
    print(f"device: {device}")

    in_path = Path(args.input)
    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("loading Florence-2…")
    model, processor, dtype = load_florence(device)

    lama = None
    if not args.dry_run:
        print("loading LaMa…")
        lama = load_lama(device)

    total = 0
    cleaned = 0
    untouched = 0
    for path in iter_images(in_path, args.limit):
        total += 1
        out_path = out_dir / f"{path.stem}.png"
        if out_path.exists() and not args.overwrite:
            print(f"  skip (exists): {path.name}")
            continue
        try:
            image = Image.open(path).convert("RGB")

            if args.dry_run:
                boxes = detect_boxes(model, processor, device, dtype, image, args.detection_prompt)
                _, drawn = build_mask(image, boxes, args.max_bbox_percent)
                print(f"  {path.name}: {len(boxes)} boxes, {drawn} kept")
                continue

            result, drawn = remove_all(
                model, processor, device, dtype, lama, image,
                args.detection_prompt, args.max_bbox_percent, args.passes,
            )
            if drawn == 0:
                image.save(out_path)  # watermark не найден — копия как есть
                untouched += 1
                print(f"  {path.name}: no watermark → copied")
            else:
                result.save(out_path)
                cleaned += 1
                print(f"  {path.name}: removed {drawn} watermark region(s)")
        except Exception as e:  # noqa: BLE001
            print(f"  FAIL {path.name}: {e}")

    print(f"\nTotal {total} | cleaned {cleaned} | untouched {untouched}")


if __name__ == "__main__":
    main()
