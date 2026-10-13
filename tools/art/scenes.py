"""Layered pixel habitats, one per pet. Four 256x144 layers each (sky, far,
near, ground) so the app can drift them at different speeds. Coordinates
are in 128x72 units."""
from __future__ import annotations

from pathlib import Path

from pixel import Canvas

W, H = 256, 144


def band(c, y0, y1, color):
    c.shape([(0, y0), (128, y0), (128, y1), (0, y1)], color, outline=None, shading=False)


def poly(c, pts, color):
    c.shape(pts, color, outline=None, shading=False)


def cloud(c, x, y, w=22, color="#fbfbf8", under="#e3e6dc"):
    poly(c, [(x + 4, y), (x + w - 6, y), (x + w - 3, y - 3), (x + w + 2, y - 3), (x + w + 4, y), (x + w + 4, y + 5), (x, y + 5), (x, y + 1)], color)
    poly(c, [(x + 8, y - 4), (x + w - 9, y - 4), (x + w - 6, y), (x + 4, y)], color)
    poly(c, [(x + 3, y + 4), (x + w + 1, y + 4), (x + w + 1, y + 5), (x + 3, y + 5)], under)


def pine(c, x, y, k=1.0, light="#b9c3b0", dark="#97a48c", trunk="#7f8676"):
    pts = [(12, 0), (16, 0), (16, 4), (19, 4), (19, 9), (23, 9), (23, 14), (27, 14), (27, 19), (1, 19), (1, 14), (5, 14), (5, 9), (9, 9), (9, 4), (12, 4)]
    poly(c, [(x + px * k, y + py * k) for px, py in pts], light)
    inner = [(14, 2), (16, 4), (19, 4), (19, 9), (23, 9), (23, 14), (27, 14), (27, 19), (14, 19)]
    poly(c, [(x + px * k, y + py * k) for px, py in inner], dark)
    poly(c, [(x + 12 * k, y + 19 * k), (x + 16 * k, y + 19 * k), (x + 16 * k, y + 25 * k), (x + 12 * k, y + 25 * k)], trunk)


def tuft(c, x, y, color="#9faa93"):
    c.rect(x, y - 2, 0.5, 2, color)
    c.rect(x + 1, y - 3, 0.5, 3, color)
    c.rect(x + 2, y - 1.5, 0.5, 1.5, color)


def platform(c, top, edge, shadow):
    poly(c, [(0, 58), (128, 58), (128, 72), (0, 72)], top)
    poly(c, [(0, 58), (128, 58), (128, 59.5), (0, 59.5)], edge)
    poly(c, [(40, 62), (88, 62), (90, 63.5), (86, 65), (42, 65), (38, 63.5)], shadow)


def mushroom(c, x, y, k=1.0, cap="#c9a08a", dot="#f3e9dc", stem="#efe7d8"):
    poly(c, [(x + 2 * k, y + 4 * k), (x + 6 * k, y + 4 * k), (x + 6 * k, y + 8 * k), (x + 2 * k, y + 8 * k)], stem)
    poly(c, [(x, y + 4 * k), (x + 1 * k, y + 1 * k), (x + 4 * k, y), (x + 7 * k, y + 1 * k), (x + 8 * k, y + 4 * k)], cap)
    c.rect(x + 2 * k, y + 1.5 * k, 1 * k, 1 * k, dot)
    c.rect(x + 5 * k, y + 2 * k, 1 * k, 1 * k, dot)


def save(c, out, name):
    c.image().save(out / name)


# ---------------------------------------------------------------- Tofu: rooftops at dusk
def rooftops(out):
    sky = Canvas(W, H)
    band(sky, 0, 72, "#efe9e1")
    band(sky, 0, 22, "#f5f0e8")
    band(sky, 40, 72, "#e8e1d6")
    save(sky, out, "tofu_sky.png")
    far = Canvas(W, H)
    cloud(far, 14, 12, 20, "#faf7f2", "#e6dfd4")
    cloud(far, 90, 18, 16, "#faf7f2", "#e6dfd4")
    # distant skyline
    for x, w, h in [(0, 14, 16), (16, 10, 22), (30, 18, 12), (52, 8, 26), (64, 16, 14), (84, 12, 20), (100, 14, 10), (118, 10, 18)]:
        poly(far, [(x, 60), (x, 60 - h), (x + w, 60 - h), (x + w, 60)], "#d8d2c8")
        for wy in range(60 - h + 3, 58, 4):
            for wx in range(x + 2, x + w - 2, 4):
                far.rect(wx, wy, 1, 1, "#ebe6dd")
    save(far, out, "tofu_far.png")
    near = Canvas(W, H)
    # nearer rooftops with chimneys and an antenna
    poly(near, [(0, 60), (0, 46), (6, 42), (30, 42), (36, 46), (36, 60)], "#b9b1a4")
    poly(near, [(4, 46), (32, 46), (32, 60), (4, 60)], "#c8c1b4")
    poly(near, [(10, 42), (14, 42), (14, 36), (10, 36)], "#a39a8c")
    poly(near, [(88, 60), (88, 48), (94, 44), (124, 44), (128, 48), (128, 60)], "#b9b1a4")
    poly(near, [(92, 48), (126, 48), (126, 60), (92, 60)], "#c8c1b4")
    near.rect(112, 36, 0.5, 8, "#8f8b82")
    near.rect(109, 38, 6.5, 0.5, "#8f8b82")
    for x in (8, 18, 98, 112):
        poly(near, [(x, 50), (x + 5, 50), (x + 5, 56), (x, 56)], "#ddd6c9")
    save(near, out, "tofu_near.png")
    ground = Canvas(W, H)
    platform(ground, "#cfc7b9", "#aaa294", "#bdb5a7")
    for x in range(0, 128, 16):
        ground.rect(x + 4, 66, 8, 0.5, "#b9b1a3")
    poly(ground, [(0, 59.5), (24, 59.5), (24, 61), (0, 61)], "#b9b1a3")
    poly(ground, [(104, 59.5), (128, 59.5), (128, 61), (104, 61)], "#b9b1a3")
    save(ground, out, "tofu_ground.png")


# ---------------------------------------------------------------- Juno: twilight pines
def pines(out):
    sky = Canvas(W, H)
    band(sky, 0, 72, "#e6e8e4")
    band(sky, 0, 18, "#eceeea")
    band(sky, 42, 72, "#dde1da")
    # moon
    poly(sky, [(100, 10), (108, 10), (111, 13), (111, 19), (108, 22), (100, 22), (97, 19), (97, 13)], "#f7f5ec")
    poly(sky, [(103, 12), (108, 12), (109, 14), (109, 18), (106, 20), (103, 20)], "#ecead9")
    for x, y in [(20, 8), (46, 14), (74, 6), (120, 16), (36, 26)]:
        sky.rect(x, y, 1, 1, "#f7f5ec")
    save(sky, out, "juno_sky.png")
    far = Canvas(W, H)
    poly(far, [(0, 54), (12, 46), (24, 50), (40, 40), (56, 48), (70, 42), (86, 47), (100, 38), (114, 46), (128, 42), (128, 60), (0, 60)], "#cdd3c9")
    for x, k in [(0, 0.7), (26, 0.55), (58, 0.65), (90, 0.7), (114, 0.5)]:
        pine(far, x, 54 - 25 * k, k, "#bcc5b6", "#a6b1a0", "#929a8b")
    save(far, out, "juno_far.png")
    near = Canvas(W, H)
    pine(near, -4, 28, 1.2, "#a3ad9b", "#86927f", "#6f766a")
    pine(near, 20, 40, 0.8, "#a3ad9b", "#86927f", "#6f766a")
    pine(near, 94, 26, 1.25, "#a3ad9b", "#86927f", "#6f766a")
    pine(near, 84, 42, 0.7, "#a3ad9b", "#86927f", "#6f766a")
    save(near, out, "juno_near.png")
    ground = Canvas(W, H)
    platform(ground, "#c5ccbb", "#a4ad9a", "#b3bba8")
    for x in [10, 24, 96, 106, 120]:
        tuft(ground, x, 60.5, "#98a38f")
    for x, y in [(14, 66), (110, 68), (30, 69)]:
        ground.rect(x, y, 2, 0.5, "#a3ab98")
    save(ground, out, "juno_ground.png")


# ---------------------------------------------------------------- Pebble: pond
def pond(out):
    sky = Canvas(W, H)
    band(sky, 0, 72, "#eaf0ec")
    band(sky, 0, 20, "#f1f5f1")
    save(sky, out, "pebble_sky.png")
    far = Canvas(W, H)
    cloud(far, 18, 14, 20)
    cloud(far, 96, 10, 18)
    poly(far, [(0, 48), (18, 40), (40, 44), (62, 36), (88, 42), (110, 38), (128, 44), (128, 60), (0, 60)], "#d3dece")
    for x, y in [(8, 42), (30, 44), (72, 40), (118, 44)]:
        for i in range(4):
            far.rect(x + i * 1.5, y - (3 if i % 2 else 2), 0.5, 6, "#b6c6b0")
    save(far, out, "pebble_far.png")
    near = Canvas(W, H)
    # water with lily pads
    poly(near, [(0, 52), (128, 52), (128, 60), (0, 60)], "#b9d2cf")
    for x, w in [(10, 10), (44, 8), (90, 12), (118, 8)]:
        poly(near, [(x, 55), (x + w, 55), (x + w, 56), (x, 56)], "#d6e6e3")
    for x, y in [(16, 53), (100, 54), (70, 56)]:
        poly(near, [(x, y), (x + 6, y), (x + 7, y + 1.5), (x + 6, y + 3), (x, y + 3), (x - 1, y + 1.5)], "#8fb08a")
        near.rect(x + 2, y + 1, 1, 1, "#f3e9dc")
    # reeds
    for x in [4, 8, 112, 122, 126]:
        near.rect(x, 44, 0.5, 10, "#8c9f7f")
        near.rect(x - 0.5, 43, 1.5, 2.5, "#7c6f5b")
    save(near, out, "pebble_near.png")
    ground = Canvas(W, H)
    platform(ground, "#d2dbc9", "#b1bda6", "#c0cab4")
    for x, y, w in [(8, 64, 4), (112, 66, 5), (24, 68, 3)]:
        poly(ground, [(x, y), (x + w, y), (x + w + 1, y + 1.5), (x - 1, y + 1.5)], "#b8c0b0")
    for x in [14, 104, 122]:
        tuft(ground, x, 61, "#9faa93")
    save(ground, out, "pebble_ground.png")


# ---------------------------------------------------------------- Ori: snow coast
def coast(out):
    sky = Canvas(W, H)
    band(sky, 0, 72, "#eceff2")
    band(sky, 0, 18, "#f3f5f7")
    band(sky, 40, 72, "#e3e8ec")
    save(sky, out, "ori_sky.png")
    far = Canvas(W, H)
    cloud(far, 10, 16, 18, "#f8f9fa", "#e2e6ea")
    cloud(far, 100, 12, 20, "#f8f9fa", "#e2e6ea")
    poly(far, [(0, 56), (0, 42), (14, 30), (26, 40), (40, 26), (54, 38), (66, 34), (80, 44), (96, 28), (110, 40), (128, 34), (128, 56)], "#d7dde2")
    for px, py in [(14, 30), (40, 26), (96, 28)]:
        poly(far, [(px - 4, py + 5), (px, py), (px + 4, py + 5), (px + 2, py + 6), (px, py + 4), (px - 2, py + 6)], "#f8f9fa")
    save(far, out, "ori_far.png")
    near = Canvas(W, H)
    # sea with ice floes
    poly(near, [(0, 50), (128, 50), (128, 60), (0, 60)], "#b7cfdb")
    for x, w in [(6, 14), (36, 10), (84, 16), (116, 10)]:
        poly(near, [(x, 52), (x + w, 52), (x + w + 2, 55), (x - 1, 55)], "#f1f4f6")
        near.rect(x + 1, 55, w, 0.5, "#dbe3e8")
    for x, w in [(24, 6), (60, 8), (104, 6)]:
        near.rect(x, 57, w, 0.5, "#d4e3ea")
    save(near, out, "ori_near.png")
    ground = Canvas(W, H)
    platform(ground, "#e6ebee", "#c5ced4", "#d4dbe0")
    for x, y, w in [(6, 63, 6), (108, 65, 7), (26, 68, 4)]:
        poly(ground, [(x, y), (x + w, y), (x + w + 1, y + 2), (x - 1, y + 2)], "#d3dbe0")
        ground.rect(x + 1, y + 0.5, 2, 0.5, "#f5f7f8")
    save(ground, out, "ori_ground.png")


# ---------------------------------------------------------------- Fern: mushroom glade
def glade(out):
    sky = Canvas(W, H)
    band(sky, 0, 72, "#edf0e6")
    band(sky, 0, 18, "#f3f5ee")
    save(sky, out, "fern_sky.png")
    far = Canvas(W, H)
    cloud(far, 20, 12, 18, "#f7f8f3", "#e4e7dc")
    cloud(far, 92, 18, 14, "#f7f8f3", "#e4e7dc")
    poly(far, [(0, 50), (16, 40), (36, 44), (58, 36), (80, 43), (104, 38), (128, 46), (128, 60), (0, 60)], "#d6dfc9")
    for x, k in [(8, 0.5), (48, 0.45), (108, 0.5)]:
        pine(far, x, 52 - 25 * k, k, "#c2cdb5", "#aab79d", "#929a8b")
    save(far, out, "fern_far.png")
    near = Canvas(W, H)
    poly(near, [(0, 58), (10, 54), (28, 56), (44, 52), (60, 57), (78, 52), (94, 56), (110, 51), (128, 56), (128, 60), (0, 60)], "#b5c6a3")
    mushroom(near, 6, 44, 1.4)
    mushroom(near, 18, 50, 0.9)
    mushroom(near, 104, 46, 1.2)
    mushroom(near, 118, 51, 0.8, "#b8a690")
    for x, y in [(36, 55), (64, 54), (84, 56)]:
        tuft(near, x, y, "#8e9f81")
    save(near, out, "fern_near.png")
    ground = Canvas(W, H)
    platform(ground, "#cfd9c1", "#aebb9f", "#bdc8ae")
    for x in [12, 28, 98, 114, 124]:
        tuft(ground, x, 61, "#9faa93")
    for x, y in [(8, 67), (118, 66), (30, 69)]:
        ground.rect(x, y, 1.5, 0.5, "#a6b39a")
    save(ground, out, "fern_ground.png")


def build(out: Path):
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.png"):
        old.unlink()
    rooftops(out)
    pines(out)
    pond(out)
    coast(out)
    glade(out)
    print("scenes written to", out)
