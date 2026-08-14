import unittest

from PIL import Image

from remove_watermarks import build_mask, is_safe_chipdip_box


class SafeChipDipBoxTest(unittest.TestCase):
    def setUp(self):
        self.image = Image.new("RGB", (100, 100), "#202020")

    def test_accepts_light_bottom_right_caption(self):
        self.image.paste("white", (70, 75, 95, 90))
        box = [70, 75, 95, 90]

        self.assertTrue(is_safe_chipdip_box(self.image, box, 12))
        _, drawn = build_mask(self.image, [box], 12)
        self.assertEqual(drawn, 1)

    def test_rejects_dark_product_region(self):
        box = [70, 75, 95, 90]

        self.assertFalse(is_safe_chipdip_box(self.image, box, 12))

    def test_rejects_caption_outside_bottom_right(self):
        self.image.paste("white", (5, 5, 25, 20))

        self.assertFalse(is_safe_chipdip_box(self.image, [5, 5, 25, 20], 12))

    def test_rejects_oversized_region(self):
        self.image.paste("white", (60, 60, 100, 100))

        self.assertFalse(is_safe_chipdip_box(self.image, [60, 60, 100, 100], 12))


if __name__ == "__main__":
    unittest.main()
