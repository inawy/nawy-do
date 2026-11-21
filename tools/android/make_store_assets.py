#!/usr/bin/env python3
"""Builds the Play Store phone screenshots (1080 x 1920) and feature graphic (1024 x 500).

Inputs: real screenshots of the production build (Pixel 7 emulation, from the `ci-screenshots`
branch) in tools/android/play/source/. Each is placed on the brand blue under an Arabic headline,
rendered by Chromium (Playwright) so Arabic shapes correctly. Nothing is drawn that the app does not
show: the screenshot is the app. Usage: make_store_assets.py   (run from the repository root)
"""
import base64
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path("tools/android/play")
SRC = ROOT / "source"
OUT = ROOT / "screenshots"

SHOTS = [
    ("android-10-rows", "سجّل نياتك بسرعة", "ناوي تعمل إيه؟ أضفها في ثوانٍ"),
    ("android-12-remind", "تاريخ وتكرار وتذكير", "تنبيه في وقته حتى والتطبيق مغلق"),
    ("android-3-starred", "قوائم تنظّم يومك", "اليوم والمفضلة والمجدولة وقوائمك"),
    ("android-dark-1-main", "وضع داكن مريح", "بياناتك على جهازك فقط، بلا حساب"),
]

CSS = """
* { box-sizing: border-box; margin: 0; }
body { font-family: 'DejaVu Sans', 'Noto Sans Arabic', sans-serif; color: #fff;
  background: linear-gradient(160deg, #4d86ff 0%, #2457d6 100%); overflow: hidden; direction: rtl; }
h1 { font-weight: 700; } p { opacity: .92; }
img { display: block; border-radius: 46px 46px 0 0; box-shadow: 0 24px 80px rgb(0 0 0 / .35); }
"""


def data_uri(name: str) -> str:
    b = (SRC / f"{name}.png").read_bytes()
    return "data:image/png;base64," + base64.b64encode(b).decode()


def shot_html(name: str, title: str, sub: str) -> str:
    return f"""<style>{CSS}
body {{ width:1080px; height:1920px; text-align:center; padding-top:120px; }}
h1 {{ font-size:96px; line-height:1.25; }} p {{ font-size:46px; margin-top:20px; }}
img {{ position:absolute; inset-inline-start:140px; top:440px; width:800px; }}
</style><h1>{title}</h1><p>{sub}</p><img src="{data_uri(name)}">"""


def graphic_html() -> str:
    return f"""<style>{CSS}
body {{ width:1024px; height:500px; }}
.t {{ position:absolute; right:70px; top:110px; width:540px; text-align:right; }}
h1 {{ font-size:84px; line-height:1.2; }} p {{ font-size:36px; margin-top:18px; }}
img {{ position:absolute; left:120px; top:46px; width:290px; border-radius:30px 30px 0 0; }}
</style><div class="t"><h1>ناوي دو</h1><p>ناوي تعمل إيه؟<br>مهامك على جهازك، بخصوصية</p></div>
<img src="{data_uri('android-10-rows')}">"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1080, "height": 1920})
        for i, (name, title, sub) in enumerate(SHOTS, 1):
            page.set_content(shot_html(name, title, sub))
            page.screenshot(path=str(OUT / f"phone-{i}.png"))
        page = browser.new_page(viewport={"width": 1024, "height": 500})
        page.set_content(graphic_html())
        page.screenshot(path=str(ROOT / "feature-graphic-1024x500.png"))
        browser.close()
    print("done")


if __name__ == "__main__":
    main()
