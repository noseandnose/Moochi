"""Layered pixel habitats: forest (Foxi), meadow (Lumi), mountains (Drako).

Each habitat is four 256x144 layers so the app can drift them at different
speeds: sky (opaque), far, near, ground. Coordinates are in 128x72 units.
"""
from __future__ import annotations

from pathlib import Path

from pixel import Canvas

W, H = 256, 144


def band(c: Canvas, y0: float, y1: float, color: str):
    c.shape([(0, y0), (128, y0), (128, y1), (0, y1)], color, outline=None, shading=False)


def cloud(c: Canvas, x: float, y: float, w: float = 22, color="#fbfbf8", under="#e3e6dc"):
    c.shape([(x + 4, y), (x + w - 6, y), (x + w - 3, y - 3), (x + w + 2, y - 3), (x + w + 4, y), (x + w + 4, y + 5),
             (x, y + 5), (x, y + 1)], color, outline=None, shading=False)
    c.shape([(x + 8, y - 4), (x + w - 9, y - 4), (x + w - 6, y), (x + 4, y)], color, outline=None, shading=False)
    c.shape([(x + 3, y + 4), (x + w + 1, y + 4), (x + w + 1, y + 5), (x + 3, y + 5)], under, outline=None, shading=False)


def pine(c: Canvas, x: float, y: float, k: float = 1.0, light="#b9c3b0", dark="#97a48c", trunk="#7f8676"):
    pts = [(12, 0), (16, 0), (16, 4), (19, 4), (19, 9), (23, 9), (23, 14), (27, 14), (27, 19), (1, 19), (1, 14), (5, 14), (5, 9), (9, 9), (9, 4), (12, 4)]
    c.shape([(x + px * k, y + py * k) for px, py in pts], light, outline=None, shading=False)
    inner = [(14, 2), (16, 4), (19, 4), (19, 9), (23, 9), (23, 14), (27, 14), (27, 19), (14, 19)]
    c.shape([(x + px * k, y + py * k) for px, py in inner], dark, outline=None, shading=False)
    c.shape([(x + 12 * k, y + 19 * k), (x + 16 * k, y + 19 * k), (x + 16 * k, y + 25 * k), (x + 12 * k, y + 25 * k)], trunk, outline=None, shading=False)


def tuft(c: Canvas, x: float, y: float, color="#9faa93"):
    c.rect(x, y - 2, 0.5, 2, color)
    c.rect(x + 1, y - 3, 0.5, 3, color)
    c.rect(x + 2, y - 1.5, 0.5, 1.5, color)


def platform(c: Canvas, top: str, edge: str, shadow: str):
    c.shape([(0, 58), (128, 58), (128, 72), (0, 72)], top, outline=None, shading=False)
    c.shape([(0, 58), (128, 58), (128, 59.5), (0, 59.5)], edge, outline=None, shading=False)
    # soft ground shadow under the pet position
    c.shape([(40, 62), (88, 62), (90, 63.5), (86, 65), (42, 65), (38, 63.5)], shadow, outline=None, shading=False)


def forest(out: Path):
    sky = Canvas(W, H)
    band(sky, 0, 72, "#eef1ea")
    band(sky, 0, 20, "#f3f5ef")
    band(sky, 44, 72, "#e8ece2")
    sky.image().save(out / "foxi_sky.png")
    far = Canvas(W, H)
    cloud(far, 10, 14, 24)
    cloud(far, 84, 9, 18)
    cloud(far, 50, 22, 14, "#f7f8f3", "#e6e9df")
    far.shape([(0, 50), (10, 44), (24, 47), (36, 40), (52, 46), (66, 41), (80, 45), (96, 39), (110, 46), (128, 42), (128, 60), (0, 60)], "#d6dccd", outline=None, shading=False)
    for x, k in [(2, 0.7), (30, 0.55), (62, 0.6), (92, 0.7), (116, 0.5)]:
        pine(far, x, 48 - 25 * k + 6, k, "#c9d1c0", "#b3bda8", "#9ea697")
    far.image().save(out / "foxi_far.png")
    near = Canvas(W, H)
    pine(near, -2, 30, 1.15)
    pine(near, 22, 42, 0.75)
    pine(near, 96, 29, 1.2)
    pine(near, 86, 44, 0.7)
    near.image().save(out / "foxi_near.png")
    ground = Canvas(W, H)
    platform(ground, "#cfd7c3", "#aeb9a2", "#bcc6b0")
    ground.shape([(0, 60), (20, 60), (26, 62), (0, 62)], "#c3ccb6", outline=None, shading=False)
    ground.shape([(104, 60), (128, 60), (128, 63), (98, 63)], "#c3ccb6", outline=None, shading=False)
    for x in [8, 15, 30, 96, 104, 118]:
        tuft(ground, x, 60.5)
    for x, y in [(12, 66), (108, 68), (122, 64), (24, 69)]:
        ground.rect(x, y, 2, 0.5, "#a9b39d")
    ground.image().save(out / "foxi_ground.png")


def meadow(out: Path):
    sky = Canvas(W, H)
    band(sky, 0, 72, "#eef2e8")
    band(sky, 0, 18, "#f4f6f0")
    sky.image().save(out / "lumi_sky.png")
    far = Canvas(W, H)
    cloud(far, 16, 12, 20)
    cloud(far, 70, 18, 14, "#f7f8f3", "#e6e9df")
    cloud(far, 100, 8, 22)
    far.shape([(0, 50), (16, 40), (36, 44), (58, 36), (80, 43), (104, 38), (128, 46), (128, 60), (0, 60)], "#dce3cf", outline=None, shading=False)
    far.shape([(0, 55), (20, 50), (44, 54), (68, 48), (92, 52), (112, 47), (128, 52), (128, 60), (0, 60)], "#cbd5b9", outline=None, shading=False)
    far.image().save(out / "lumi_far.png")
    near = Canvas(W, H)
    near.shape([(0, 58), (12, 53), (28, 56), (40, 52), (56, 57), (74, 51), (90, 56), (108, 50), (128, 56), (128, 60), (0, 60)], "#b9c7a6", outline=None, shading=False)
    for x, y in [(6, 54), (20, 56), (44, 54), (84, 55), (102, 52), (120, 55)]:
        tuft(near, x, y, "#8e9f81")
    for x, y in [(14, 53), (72, 52), (112, 51)]:
        near.rect(x, y, 1, 1, "#e2c977")
        near.rect(x - 0.5, y - 0.5, 0.5, 0.5, "#8e9f81")
    near.image().save(out / "lumi_near.png")
    ground = Canvas(W, H)
    platform(ground, "#d4dcc4", "#b6c2a4", "#c2cdb1")
    for x in [10, 26, 98, 112, 124]:
        tuft(ground, x, 61, "#9faa93")
    for x, y in [(8, 67), (116, 66), (30, 69), (100, 69)]:
        ground.rect(x, y, 1.5, 0.5, "#aab49d")
    ground.image().save(out / "lumi_ground.png")


def mountains(out: Path):
    sky = Canvas(W, H)
    band(sky, 0, 72, "#eceff0")
    band(sky, 0, 16, "#f2f4f5")
    band(sky, 40, 72, "#e5e9e8")
    sky.image().save(out / "drako_sky.png")
    far = Canvas(W, H)
    cloud(far, 12, 20, 16, "#f7f8f6", "#e4e7e5")
    cloud(far, 92, 14, 20, "#f7f8f6", "#e4e7e5")
    peaks = [(0, 60), (0, 44), (10, 34), (18, 40), (28, 24), (40, 36), (50, 30), (60, 42), (72, 22), (84, 34), (94, 28), (106, 40), (118, 32), (128, 40), (128, 60)]
    far.shape(peaks, "#d2d7d1", outline=None, shading=False)
    for px, py in [(28, 24), (72, 22), (94, 28)]:
        far.shape([(px - 4, py + 5), (px, py), (px + 4, py + 5), (px + 2, py + 5.5), (px, py + 4), (px - 2, py + 6)], "#f6f7f4", outline=None, shading=False)
    far.image().save(out / "drako_far.png")
    near = Canvas(W, H)
    near.shape([(0, 60), (0, 50), (12, 42), (24, 50), (36, 46), (48, 56), (60, 60)], "#aab2a7", outline=None, shading=False)
    near.shape([(70, 60), (84, 48), (96, 54), (108, 44), (120, 52), (128, 50), (128, 60)], "#aab2a7", outline=None, shading=False)
    near.shape([(0, 60), (0, 54), (12, 48), (20, 54), (12, 46), (6, 52)], "#99a39a", outline=None, shading=False)
    near.shape([(100, 60), (108, 48), (116, 56), (108, 44)], "#99a39a", outline=None, shading=False)
    near.image().save(out / "drako_near.png")
    ground = Canvas(W, H)
    platform(ground, "#cdd1c6", "#aeb3a8", "#bcc1b5")
    for x, y, w in [(6, 63, 5), (20, 67, 3), (102, 64, 6), (118, 68, 3)]:
        ground.shape([(x, y), (x + w, y), (x + w + 1, y + 2), (x - 1, y + 2)], "#b7bcb0", outline=None, shading=False)
        ground.rect(x + 1, y + 0.5, 2, 0.5, "#d9dcd4")
    for x in [14, 110, 124]:
        tuft(ground, x, 61, "#a3ab9c")
    ground.image().save(out / "drako_ground.png")


def build(out: Path):
    out.mkdir(parents=True, exist_ok=True)
    forest(out)
    meadow(out)
    mountains(out)
    print("scenes written to", out)
