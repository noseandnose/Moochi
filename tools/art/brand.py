"""Logo, app icon, splash and favicon generation."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

from pets import draw_foxi, draw_lumi, draw_drako
from pixel import Canvas, upscale

FONT = {
    "M": ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X"],
    "O": [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
    "C": [".XXX.", "X...X", "X....", "X....", "X....", "X...X", ".XXX."],
    "H": ["X...X", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
    "I": ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "XXXXX"],
}


def logo(text: str, color=(32, 35, 31, 255), gap=2):
    w = len(text) * 5 + (len(text) - 1) * gap
    img = Image.new("RGBA", (w, 7), (0, 0, 0, 0))
    x = 0
    for ch in text:
        rows = FONT[ch]
        for y, row in enumerate(rows):
            for i, cell in enumerate(row):
                if cell == "X":
                    img.putpixel((x + i, y), color)
        x += 5 + gap
    return img


def rounded_bg(size: int, color: str, radius: int):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=color)
    return img


def build(assets: Path):
    brand = assets / "brand"
    brand.mkdir(parents=True, exist_ok=True)
    # Logo at 8x (crisp when displayed at any multiple of 8px/cell or smaller).
    upscale(logo("MOCHI"), 8).save(brand / "logo.png")
    upscale(logo("MOCHI", (250, 249, 246, 255)), 8).save(brand / "logo-light.png")

    # Welcome trio for the share card and onboarding: all three teens side by side.
    trio = Image.new("RGBA", (128 * 3 - 40, 128), (0, 0, 0, 0))
    for i, fn in enumerate([draw_foxi, draw_lumi, draw_drako]):
        c = Canvas()
        fn(c, 2, 0, "open")
        trio.alpha_composite(c.image(), (i * (128 - 20), 0))
    trio.save(brand / "trio.png")

    # App icon: Foxi head on a sage tile.
    images = assets / "images"
    images.mkdir(parents=True, exist_ok=True)
    c = Canvas()
    draw_foxi(c, 2, 0, "open", tail=False)
    sprite = c.image().crop((20, 10, 108, 98))  # head and shoulders
    icon = Image.new("RGBA", (1024, 1024), "#8ea58d")
    big = sprite.resize((88 * 10, 88 * 10), Image.NEAREST)
    icon.alpha_composite(big, ((1024 - 880) // 2, (1024 - 880) // 2 + 20))
    icon.save(images / "icon.png")
    # Android adaptive icon layers.
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    small = sprite.resize((88 * 7, 88 * 7), Image.NEAREST)
    fg.alpha_composite(small, ((1024 - 616) // 2, (1024 - 616) // 2 + 10))
    fg.save(images / "android-icon-foreground.png")
    Image.new("RGBA", (1024, 1024), "#8ea58d").save(images / "android-icon-background.png")
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    alpha = small.split()[3]
    white = Image.new("RGBA", small.size, (255, 255, 255, 255))
    white.putalpha(alpha)
    mono.alpha_composite(white, ((1024 - 616) // 2, (1024 - 616) // 2 + 10))
    mono.save(images / "android-icon-monochrome.png")
    # Splash icon: the logo.
    upscale(logo("MOCHI"), 24).save(images / "splash-icon.png")
    # Favicon.
    icon.resize((64, 64), Image.LANCZOS).save(images / "favicon.png")
    print("brand assets written")
