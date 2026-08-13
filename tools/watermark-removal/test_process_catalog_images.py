import io
import unittest

from PIL import Image

from process_catalog_images import (
    has_lcsc_blue_watermark,
    open_rgb,
    storage_key,
    to_webp,
    validate_public_url,
)


class MediaPipelineTest(unittest.TestCase):
    def test_rejects_private_candidate_url(self):
        with self.assertRaises(ValueError):
            validate_public_url("http://127.0.0.1/image.jpg")

    def test_detects_lcsc_blue_background(self):
        blue = Image.new("RGB", (64, 64), (30, 90, 190))
        white = Image.new("RGB", (64, 64), "white")
        self.assertTrue(has_lcsc_blue_watermark(blue))
        self.assertFalse(has_lcsc_blue_watermark(white))

    def test_transcodes_to_content_addressed_webp(self):
        source = Image.new("RGB", (1600, 800), "white")
        content = to_webp(source)
        decoded = open_rgb(content)
        self.assertEqual(decoded.size, (1000, 500))
        self.assertRegex(storage_key(content), r"^products/[0-9a-f]{2}/[0-9a-f]{64}\.webp$")

    def test_flattens_transparency_to_white(self):
        source = Image.new("RGBA", (2, 2), (0, 0, 0, 0))
        buffer = io.BytesIO()
        source.save(buffer, format="PNG")
        self.assertEqual(open_rgb(buffer.getvalue()).getpixel((0, 0)), (255, 255, 255))


if __name__ == "__main__":
    unittest.main()
