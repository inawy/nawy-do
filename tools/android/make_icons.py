#!/usr/bin/env python3
"""Draws Nawy To Do's launcher and notification icons into the generated Android project (ADR 0045).

Same mark as public/icons/icon.svg: a white check on the brand blue. Needs Pillow. Usage:
make_icons.py <android/app/src/main/res>
"""
import os
import sys

from PIL import Image, ImageDraw

BLUE = "#3d7bff"
# The check from icon.svg, in its 512 x 512 box.
CHECK = [(154, 266), (226, 338), (364, 186)]
DENSITY = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}


def check(size: int, box: float, color: str, background=None) -> Image.Image:
    """The check drawn so the 512-unit box fills `box` of the canvas, centred."""
    scale = 4  # draw big, then shrink: smooth edges
    big = size * scale
    img = Image.new("RGBA", (big, big), background or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    k = big * box / 512
    off = big * (1 - box) / 2
    pts = [(off + x * k, off + y * k) for x, y in CHECK]
    w = max(1, int(44 * k))
    d.line(pts, fill=color, width=w, joint="curve")
    for x, y in (pts[0], pts[-1]):
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=color)
    return img.resize((size, size), Image.LANCZOS)


def save(img: Image.Image, res: str, folder: str, name: str) -> None:
    os.makedirs(os.path.join(res, folder), exist_ok=True)
    img.save(os.path.join(res, folder, name))


def main(res: str) -> None:
    # Remove the template's launcher files so nothing of Capacitor's stays.
    for folder in os.listdir(res):
        for name in os.listdir(os.path.join(res, folder)):
            if name.startswith("ic_launcher"):
                os.remove(os.path.join(res, folder, name))
    for dens, mult in DENSITY.items():
        legacy = round(48 * mult)
        full = round(108 * mult)
        base = Image.new("RGBA", (legacy, legacy), BLUE)
        base.alpha_composite(check(legacy, 0.8, "white"))
        rounded = Image.new("RGBA", (legacy, legacy), (0, 0, 0, 0))
        mask = Image.new("L", (legacy, legacy), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, legacy - 1, legacy - 1], legacy // 5, fill=255)
        rounded.paste(base, (0, 0), mask)
        round_mask = Image.new("L", (legacy, legacy), 0)
        ImageDraw.Draw(round_mask).ellipse([0, 0, legacy - 1, legacy - 1], fill=255)
        round_img = Image.new("RGBA", (legacy, legacy), (0, 0, 0, 0))
        round_img.paste(base, (0, 0), round_mask)
        save(rounded, res, f"mipmap-{dens}", "ic_launcher.png")
        save(round_img, res, f"mipmap-{dens}", "ic_launcher_round.png")
        # Adaptive layers: the system shows the middle 72 of 108, so the mark stays inside 60%.
        save(check(full, 0.5, "white"), res, f"mipmap-{dens}", "ic_launcher_foreground.png")
        save(check(full, 0.5, "black"), res, f"mipmap-{dens}", "ic_launcher_monochrome.png")
        small = round(24 * mult)
        save(check(small, 0.9, "white"), res, f"drawable-{dens}", "ic_stat_nawy.png")
    os.makedirs(os.path.join(res, "mipmap-anydpi-v26"), exist_ok=True)
    adaptive = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
        '    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>\n'
        "</adaptive-icon>\n"
    )
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        with open(os.path.join(res, "mipmap-anydpi-v26", name), "w", encoding="utf-8") as f:
            f.write(adaptive)
    os.makedirs(os.path.join(res, "values"), exist_ok=True)
    with open(os.path.join(res, "values", "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
        f.write(
            '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
            f'    <color name="ic_launcher_background">{BLUE}</color>\n</resources>\n'
        )
    print("icons written")


if __name__ == "__main__":
    main(sys.argv[1])
