"""
Tiny pixel-art DSL used to build every YOUchi sprite deterministically.

Coordinates are given in a 64x64 "unit" space (1 unit = 2 px) so the
original web silhouettes can be reused, while all rasterisation happens on a
128x128 pixel grid. Shapes get a one-pixel outline and automatic shading
(light from the top-left) so every part shares the same material language.
"""
from __future__ import annotations

import colorsys
import math
from dataclasses import dataclass, field

import numpy as np
from PIL import Image

INK = "#2a2823"
SCALE = 2  # px per unit


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def rgb_to_hex(rgb) -> str:
    return "#%02x%02x%02x" % tuple(max(0, min(255, int(round(c)))) for c in rgb)


def adjust(color: str, light: float = 1.0, sat: float = 1.0, hue_shift: float = 0.0) -> str:
    r, g, b = (c / 255 for c in hex_to_rgb(color))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = max(0.0, min(1.0, l * light))
    s = max(0.0, min(1.0, s * sat))
    h = (h + hue_shift) % 1.0
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return rgb_to_hex((r * 255, g * 255, b * 255))


def shade(color: str) -> str:
    """Shadow tone: darker, slightly more saturated, shifted cooler."""
    return adjust(color, light=0.78, sat=1.08, hue_shift=0.01)


def soft(color: str) -> str:
    return adjust(color, light=0.9, sat=1.03)


def tint(color: str) -> str:
    """Highlight tone: lighter, slightly desaturated."""
    return adjust(color, light=1.14, sat=0.9)


@dataclass
class Canvas:
    width: int = 128
    height: int = 128
    px: np.ndarray = field(init=False)
    dx: float = 0.0
    dy: float = 0.0

    def __post_init__(self):
        self.px = np.zeros((self.height, self.width, 4), dtype=np.uint8)

    # ------------------------------------------------------------------ basics
    def set(self, x: int, y: int, color: str, alpha: int = 255):
        if 0 <= x < self.width and 0 <= y < self.height:
            self.px[y, x] = (*hex_to_rgb(color), alpha)

    def rect(self, x: float, y: float, w: float = 1, h: float = 1, color: str = INK):
        """Fill a rectangle given in unit space (half units allowed)."""
        x0 = int(round((x + self.dx) * SCALE))
        y0 = int(round((y + self.dy) * SCALE))
        x1 = x0 + max(1, int(round(w * SCALE)))
        y1 = y0 + max(1, int(round(h * SCALE)))
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                self.set(xx, yy, color)

    def pixel(self, x: float, y: float, color: str = INK):
        """A single 1px dot at unit coordinates (quarter-unit precision)."""
        self.set(int(round((x + self.dx) * SCALE)), int(round((y + self.dy) * SCALE)), color)

    def part(self, dx: float, dy: float):
        return _Part(self, dx, dy)

    # ------------------------------------------------------------------ shapes
    def mask(self, points) -> np.ndarray:
        pts = [((x + self.dx) * SCALE, (y + self.dy) * SCALE) for x, y in points]
        m = np.zeros((self.height, self.width), dtype=bool)
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        x0, x1 = max(0, int(math.floor(min(xs)))), min(self.width, int(math.ceil(max(xs))))
        y0, y1 = max(0, int(math.floor(min(ys)))), min(self.height, int(math.ceil(max(ys))))
        n = len(pts)
        for y in range(y0, y1):
            py = y + 0.5
            crossings = []
            for i in range(n):
                xi, yi = pts[i]
                xj, yj = pts[i - 1]
                if (yi > py) != (yj > py):
                    crossings.append((xj - xi) * (py - yi) / (yj - yi) + xi)
            crossings.sort()
            for k in range(0, len(crossings) - 1, 2):
                a = max(x0, int(math.ceil(crossings[k] - 0.5)))
                b = min(x1, int(math.floor(crossings[k + 1] - 0.5)) + 1)
                if b > a:
                    m[y, a:b] = True
        return m

    def shape(self, points, fill: str, outline: str | None = INK, shading: bool = True,
              light_edge: int = 2, shadow_depth: int = 2, inner_shadow: bool = True):
        m = self.mask(points)
        self.paint_mask(m, fill, outline, shading, light_edge, shadow_depth, inner_shadow)
        return m

    def ellipse(self, cx: float, cy: float, rx: float, ry: float, fill: str, outline: str | None = INK,
                shading: bool = True, segments: int = 28, **kw):
        pts = [(cx + rx * math.cos(2 * math.pi * i / segments), cy + ry * math.sin(2 * math.pi * i / segments))
               for i in range(segments)]
        return self.shape(pts, fill, outline, shading, **kw)

    def paint_mask(self, m: np.ndarray, fill: str, outline: str | None = INK, shading: bool = True,
                   light_edge: int = 2, shadow_depth: int = 2, inner_shadow: bool = True):
        h, w = m.shape
        if outline:
            ring = dilate(m) & ~m
            ys, xs = np.nonzero(ring)
            for y, x in zip(ys, xs):
                self.set(int(x), int(y), outline)
        dark = shade(fill)
        mid = soft(fill)
        hi = tint(fill)
        ys, xs = np.nonzero(m)
        for y, x in zip(ys, xs):
            c = fill
            if shading:
                below = m[y + shadow_depth, x] if y + shadow_depth < h else False
                right = m[y, x + shadow_depth] if x + shadow_depth < w else False
                if not below or not right:
                    c = dark
                elif inner_shadow and not (m[y + 5, x + 3] if (y + 5 < h and x + 3 < w) else False):
                    c = mid
                above = m[y - light_edge, x] if y - light_edge >= 0 else False
                far_below = m[y + 3, x] if y + 3 < h else False
                if not above and far_below:
                    c = hi
            self.set(int(x), int(y), c)

    # ------------------------------------------------------------------ output
    def image(self) -> Image.Image:
        return Image.fromarray(self.px, "RGBA")

    def blit(self, other: "Canvas", ox: int = 0, oy: int = 0):
        src = other.image()
        dst = self.image()
        dst.alpha_composite(src, (ox, oy))
        self.px = np.array(dst)

    def flip_h(self):
        self.px = self.px[:, ::-1].copy()


class _Part:
    def __init__(self, c: Canvas, dx: float, dy: float):
        self.c, self.dx, self.dy = c, dx, dy

    def __enter__(self):
        self.c.dx += self.dx
        self.c.dy += self.dy
        return self.c

    def __exit__(self, *a):
        self.c.dx -= self.dx
        self.c.dy -= self.dy


def dilate(m: np.ndarray) -> np.ndarray:
    out = m.copy()
    out[1:, :] |= m[:-1, :]
    out[:-1, :] |= m[1:, :]
    out[:, 1:] |= m[:, :-1]
    out[:, :-1] |= m[:, 1:]
    return out


def tf(points, sx: float = 1.0, sy: float | None = None, ox: float = 0.0, oy: float = 0.0,
       cx: float = 32.0, cy: float = 56.0):
    """Scale points about (cx, cy) then translate. Default pivot: bottom centre."""
    if sy is None:
        sy = sx
    return [((x - cx) * sx + cx + ox, (y - cy) * sy + cy + oy) for x, y in points]


def mirror(points, cx: float = 32.0):
    return [(2 * cx - x, y) for x, y in points]


def upscale(img: Image.Image, factor: int) -> Image.Image:
    return img.resize((img.width * factor, img.height * factor), Image.NEAREST)
