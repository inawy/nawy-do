#!/usr/bin/env python3
"""Draws the Play Store feature graphic (1024 x 500): the brand check on the brand blue, no text.

No text on purpose: Arabic shaping needs a font and a layout engine we do not ship, and the store
shows the app name next to the graphic anyway. Needs Pillow. Usage: make_feature_graphic.py <out.png>
"""
import sys

from PIL import Image, ImageDraw

BLUE = "#3d7bff"
W, H = 1024, 500
CHECK = [(154, 266), (226, 338), (364, 186)]  # the mark's own 512 x 512 box, as in icon.svg


def main(out: str) -> None:
    scale = 3
    img = Image.new("RGB", (W * scale, H * scale), BLUE)
    d = ImageDraw.Draw(img)
    k = H * scale * 0.62 / 512  # the mark fills ~62% of the height
    ox = (W * scale - 512 * k) / 2
    oy = (H * scale - 512 * k) / 2
    pts = [(ox + x * k, oy + y * k) for x, y in CHECK]
    w = int(44 * k)
    d.line(pts, fill="white", width=w, joint="curve")
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill="white")
    img.resize((W, H), Image.LANCZOS).save(out)
    print("wrote", out)


if __name__ == "__main__":
    main(sys.argv[1])
