"""
MOCHI's cast: five original pocket pets in a chunky Tamagotchi-style pixel
look. Big heads, simple rounded bodies, clean silhouettes, a small palette.

Each pet is built from parts in a 64x64 unit space (1 unit = 2 px) with the
floor at y = 57. Stages change proportions, add parts and details rather than
just scaling, and every pet has three motion frames and three eye states.
"""
from __future__ import annotations

import math

from pixel import INK, Canvas, mirror, tf

GROUND = 57.0

# ------------------------------------------------------------------ helpers

def eye(c: Canvas, x: float, y: float, mode: str, scale: float = 1.0):
    """Tamagotchi eye: a tall black oval with a highlight. (x, y) is top-left of a 4x5 box."""
    s = scale
    if mode == "happy":
        c.rect(x, y + 2 * s, 1 * s, 2 * s)
        c.rect(x + 1 * s, y + 1 * s, 2 * s, 1 * s)
        c.rect(x + 3 * s, y + 2 * s, 1 * s, 2 * s)
        return
    if mode == "blink":
        c.rect(x, y + 3 * s, 4 * s, 1 * s)
        return
    c.rect(x + 0.5 * s, y, 3 * s, 5 * s)
    c.rect(x, y + 1 * s, 4 * s, 3 * s)
    c.rect(x + 0.5 * s, y + 0.5 * s, 1 * s, 1.5 * s, "#ffffff")
    c.rect(x + 2.5 * s, y + 3.5 * s, 0.5 * s, 0.5 * s, "#9aa3a0")


def star(c: Canvas, x: float, y: float, color: str = "#e2c977"):
    c.rect(x, y - 2, 1, 5, color)
    c.rect(x - 2, y, 5, 1, color)
    c.rect(x, y, 1, 1, "#fff6d6")


def blush(c: Canvas, x: float, y: float, color: str, s: float = 1.0):
    c.rect(x, y, 2 * s, 1 * s, color)


def round_body(cx: float, cy: float, rx: float, ry: float, n: int = 20):
    """Rounded blob outline as a polygon (slightly squared at the bottom)."""
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x = cx + rx * math.cos(a)
        y = cy + ry * math.sin(a)
        if y > cy + ry * 0.82:  # flatten the base so the pet sits on the ground
            y = cy + ry * 0.82 + (y - cy - ry * 0.82) * 0.35
        pts.append((x, y))
    return pts


def oval(cx, cy, rx, ry, n=20):
    return [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)]


# ------------------------------------------------------------------ poses
# (overall scale, head scale, head lift, x shift) per stage. Shared by the
# body drawers and the overlay drawer so gear always lands on the head.
POSES = {
    1: (0.62, 1.22, 2, 0.0),   # baby: tiny body, big head
    2: (0.88, 1.0, 0, 0.0),    # teen
    3: (0.98, 0.95, -4, 0.0),  # adult: taller
    4: (1.0, 0.92, -6, 0.0),   # companion
}


def pose(pet: str, stage: int):
    return POSES[stage]


HEAD_PIVOT = {"tofu": (32, 30), "juno": (32, 30), "pebble": (32, 32), "ori": (32, 27), "fern": (32, 31)}
ANCHORS = {
    "tofu": dict(hatY=18, faceY=27, neckY=40, bowX=45),
    "juno": dict(hatY=14, faceY=22, neckY=40, bowX=46),
    "pebble": dict(hatY=15, faceY=24, neckY=42, bowX=46),
    "ori": dict(hatY=12, faceY=22, neckY=38, bowX=44),
    "fern": dict(hatY=23, faceY=28, neckY=44, bowX=46),
}


def transforms(stage: int, pet: str):
    s, hs, lift, shift = POSES[stage]
    px, py = HEAD_PIVOT[pet]
    T = lambda pts, sx=1.0, sy=None, ox=0.0, oy=0.0, cx=32.0, cy=GROUND: tf(
        pts, sx * s, (sy if sy is not None else sx) * s, ox * s + shift, oy * s, cx, cy
    )
    H = lambda pts: T(tf(pts, hs, hs, 0, lift, px, py))
    return s, hs, T, H


# ------------------------------------------------------------------ Tofu (cat)
TOFU = dict(fur="#efe6d2", dark="#8f8b82", inner="#d9b3a4", nose="#2a2823", blush="#e0b9a8")


def draw_tofu(c: Canvas, stage: int, motion: int, eyes: str):
    p = TOFU
    s, hs, T, H = transforms(stage, "tofu")
    bs = {1: 0.8, 2: 1.0, 3: 1.2, 4: 1.3}[stage]
    # tail: long, curls up on the right; sways
    tdx = [0, 1.5, -1.0][motion]
    tdy = [0, -1.5, 1.0][motion]
    with c.part(tdx * s, tdy * s):
        # a thick S-curved tail rising behind the right side of the body
        tail = [(38, 54), (44, 54), (49, 50), (52, 44), (52, 36), (49, 30), (45, 29), (45, 33), (48, 37), (48, 43), (45, 48), (40, 50)]
        tip = [(45, 29), (49, 28), (52, 32), (52, 36), (49, 36), (47, 33)]
        if stage >= 3:
            tail = tf(tail, 1.08, 1.2, 0, 0, 40, 54)
            tip = tf(tip, 1.08, 1.2, 0, 0, 40, 54)
        c.shape(T(tail), p["fur"])
        c.shape(T(tip), p["dark"], shading=False)
    # body
    body = tf([(25, 40), (39, 40), (43, 43), (45, 48), (44, 54), (40, 56), (24, 56), (20, 54), (19, 48), (21, 43)], 1.0, bs, 0, 0, 32, 56)
    c.shape(T(body), p["fur"])
    if stage >= 3:  # chest fluff
        c.shape(T(tf([(28, 41), (36, 41), (35, 46), (32, 48), (29, 46)], 1.0, bs, 0, 0, 32, 56)), "#faf6ec", outline=None, shading=False)
    # legs
    for x in (22, 35):
        c.shape(T([(x, 50), (x + 7, 50), (x + 7, 56), (x, 56)]), p["fur"], shading=False)
        c.rect(*T([(x + 1.5, 54.5)])[0], 1 * s, 1 * s, p["dark"])
        c.rect(*T([(x + 4, 54.5)])[0], 1 * s, 1 * s, p["dark"])
    # head: wide rounded with pointed ears
    ear_dx = [0, 0, -1.0][motion]
    with c.part(ear_dx * s * hs, 0):
        c.shape(H([(18, 22), (16, 8), (28, 17)]), p["fur"])
        c.shape(H([(19, 19), (18, 11), (25, 17)]), p["inner"], outline=None, shading=False)
    c.shape(H([(46, 22), (48, 8), (36, 17)]), p["fur"])
    c.shape(H([(45, 19), (46, 11), (39, 17)]), p["inner"], outline=None, shading=False)
    head = [(20, 17), (44, 17), (48, 22), (48, 32), (44, 39), (36, 41), (28, 41), (20, 39), (16, 32), (16, 22)]
    c.shape(H(head), p["fur"])
    # forehead stripes
    for pt in H([(29, 18.5), (33, 18), (37, 18.5)]):
        c.rect(pt[0], pt[1], 1.5 * hs * s, 2.5 * hs * s, p["dark"])
    es = hs * s
    for ex in (22, 38):
        x, y = H([(ex, 27)])[0]
        eye(c, x, y, eyes, es)
    nx, ny = H([(31, 33)])[0]
    c.rect(nx, ny, 2 * es, 1.5 * es, p["nose"])
    mx, my = H([(29, 35)])[0]
    if eyes == "happy":
        c.rect(mx, my, 6 * es, 1.5 * es, p["nose"])
        c.rect(mx + 1.5 * es, my, 3 * es, 0.8 * es, "#c96a5a")
    else:
        c.rect(mx, my, 2 * es, 1 * es)
        c.rect(mx + 4 * es, my, 2 * es, 1 * es)
        c.rect(mx + 2 * es, my - 1 * es, 2 * es, 1 * es)
    for bx in (18.5, 41.5):
        x, y = H([(bx, 32)])[0]
        blush(c, x, y, p["blush"], es)
    # whiskers
    for wx, wy in [(12.5, 29), (12.5, 31.5), (48.5, 29), (48.5, 31.5)]:
        x, y = H([(wx, wy)])[0]
        c.rect(x, y, 3 * es, 0.5 * es, p["dark"])
    if stage >= 4:
        c.shape(T([(23, 40), (41, 40), (41, 42.5), (23, 42.5)]), "#7e9a80", outline=INK, shading=False)
        c.rect(*T([(31, 41)])[0], 2 * s, 1.5 * s, "#e2c977")
        for pt in H([(13, 16), (51, 14)]):
            star(c, pt[0], pt[1])


# ------------------------------------------------------------------ Juno (owl)
JUNO = dict(body="#8a7a6b", wing="#6a5b4f", face="#f2e8d6", belly="#e7dcc6", beak="#d9a441", blush="#d9b3a4")


def draw_juno(c: Canvas, stage: int, motion: int, eyes: str):
    p = JUNO
    s, hs, T, H = transforms(stage, "juno")
    bs = {1: 0.8, 2: 1.0, 3: 1.18, 4: 1.28}[stage]
    # body (egg shape)
    body = tf(round_body(32, 46, 13, 12), 1.0, bs, 0, 0, 32, 56)
    c.shape(T(body), p["body"])
    belly = tf([(26, 42), (38, 42), (41, 50), (37, 55), (27, 55), (23, 50)], 1.0, bs, 0, 0, 32, 56)
    c.shape(T(belly), p["belly"], outline=None)
    for yy in (45, 48, 51):
        for xx in (27, 31, 35):
            pt = T(tf([(xx + (2 if yy == 48 else 0), yy)], 1.0, bs, 0, 0, 32, 56))[0]
            c.rect(pt[0], pt[1], 1.5 * s, 1 * s, "#cdbfa6")
    # wings (flap)
    wdy = [0, -1.5, -3.0][motion]
    wrot = [0, 1.0, 2.5][motion]
    with c.part(0, wdy * s):
        wl = [(21, 40), (16, 44), (15 - wrot, 52), (19, 55), (23, 50)]
        wr = mirror(wl)
        c.shape(T(wl), p["wing"])
        c.shape(T(wr), p["wing"])
    # feet
    for x in (25, 34):
        c.shape(T([(x, 54), (x + 5, 54), (x + 6, 57), (x - 1, 57)]), p["beak"], shading=False)
    # head: round with ear tufts
    tuft = {1: 4, 2: 6, 3: 8, 4: 10}[stage]
    head = [(18, 26), (18, 16), (22, 11 - tuft * 0.2), (20, 10 - tuft), (28, 13), (36, 13), (44, 10 - tuft), (42, 11 - tuft * 0.2), (46, 16), (46, 26), (42, 36), (22, 36)]
    c.shape(H(head), p["body"])
    # face disc (two joined discs)
    c.shape(H(oval(26, 25, 7, 8)), p["face"], outline=None)
    c.shape(H(oval(38, 25, 7, 8)), p["face"], outline=None)
    es = hs * s * 1.25
    for ex in (22.5, 36.5):
        x, y = H([(ex, 21)])[0]
        eye(c, x, y, eyes, es)
    # beak
    c.shape(H([(30, 29), (34, 29), (32, 33)]), p["beak"], shading=False)
    if eyes == "happy":
        for bx in (21, 40):
            x, y = H([(bx, 31)])[0]
            blush(c, x, y, p["blush"], es)
    if stage >= 3:  # brow feathers
        for pt in H([(20, 15), (41, 15)]):
            c.rect(pt[0], pt[1], 3 * hs * s, 1 * hs * s, p["face"])
    if stage >= 4:
        for pt in H([(12, 14), (52, 12)]):
            star(c, pt[0], pt[1])


# ------------------------------------------------------------------ Pebble (axolotl)
PEBBLE = dict(body="#8db5ad", dark="#5f8a82", gill="#e0907a", gill2="#c4705c", belly="#dfe9df", blush="#f0b5a3")


def draw_pebble(c: Canvas, stage: int, motion: int, eyes: str):
    p = PEBBLE
    s, hs, T, H = transforms(stage, "pebble")
    bs = {1: 0.8, 2: 1.0, 3: 1.15, 4: 1.25}[stage]
    # tail with fin, sways
    tdx = [0, 1.0, -1.0][motion]
    with c.part(tdx * s, 0):
        tail = [(40, 44), (50, 40), (57, 42), (58, 50), (54, 56), (44, 56), (40, 52)]
        if stage >= 3:
            tail = tf(tail, 1.15, 1.1, 0, 0, 40, 56)
        c.shape(T(tail), p["body"])
        fin = [(50, 40), (56, 36), (60, 44), (58, 50), (57, 42)]
        if stage >= 3:
            fin = tf(fin, 1.15, 1.1, 0, 0, 40, 56)
        c.shape(T(fin), p["belly"], shading=False)
    # body
    body = tf([(23, 40), (41, 40), (45, 46), (45, 54), (41, 57), (23, 57), (19, 54), (19, 46)], 1.0, bs, 0, 0, 32, 56)
    c.shape(T(body), p["body"])
    belly = tf([(27, 46), (37, 46), (39, 52), (36, 56), (28, 56), (25, 52)], 1.0, bs, 0, 0, 32, 56)
    c.shape(T(belly), p["belly"], outline=None, shading=False)
    for x in (20, 38):
        c.shape(T([(x, 50), (x + 6, 50), (x + 6, 57), (x, 57)]), p["body"], shading=False)
    # gills: three frills each side, wiggle
    gdy = [0, -1.0, 1.0][motion]
    with c.part(0, gdy * s * hs):
        for side in (-1, 1):
            for i, (gx, gy, gl, tilt) in enumerate([(17, 19, 7, -2.5), (15, 24, 8, 0), (17, 29, 7, 2.5)]):
                base_x = 32 + side * (32 - gx)
                tip_x = base_x - side * gl
                pts = [(base_x, gy - 1), (tip_x + side * 2, gy - 2.5 + tilt), (tip_x, gy - 1 + tilt), (tip_x - side * 0.5, gy + 1 + tilt), (tip_x + side * 2, gy + 2.5 + tilt), (base_x, gy + 1.5)]
                c.shape(H(pts), p["gill"], shading=False)
                c.rect(*H([(tip_x + side * 1.5, gy - 0.5 + tilt)])[0], 1.5 * hs * s, 1 * hs * s, p["gill2"])
    # head: wide and rounded, overlapping the body
    head = [(21, 34), (19, 26), (20, 19), (24, 15), (32, 13), (40, 15), (44, 19), (45, 26), (43, 34), (39, 40), (25, 40)]
    c.shape(H(head), p["body"])
    es = hs * s
    for ex in (22, 38):
        x, y = H([(ex, 24)])[0]
        eye(c, x, y, eyes, es)
    mx, my = H([(26, 33)])[0]
    if eyes == "happy":
        c.rect(mx, my, 12 * es, 1.5 * es, INK)
        c.rect(mx + 3 * es, my, 6 * es, 0.8 * es, "#c96a5a")
    else:  # the famous axolotl smile
        c.rect(mx, my - 1 * es, 1 * es, 1 * es)
        c.rect(mx + 1 * es, my, 10 * es, 1 * es)
        c.rect(mx + 11 * es, my - 1 * es, 1 * es, 1 * es)
    for bx in (19.5, 41):
        x, y = H([(bx, 30)])[0]
        blush(c, x, y, p["blush"], es)
    if stage >= 3:  # spots
        for pt in H([(27, 17), (36, 16), (30, 20)]):
            c.rect(pt[0], pt[1], 1.5 * es, 1 * es, p["dark"])
    if stage >= 4:
        for pt in H([(12, 12), (52, 12)]):
            star(c, pt[0], pt[1])


# ------------------------------------------------------------------ Ori (penguin)
ORI = dict(body="#3f4650", dark="#2f353d", belly="#f3eee2", beak="#e0a84a", blush="#d9a7a0", crest="#e2c977")


def draw_ori(c: Canvas, stage: int, motion: int, eyes: str):
    p = ORI
    s, hs, T, H = transforms(stage, "ori")
    bs = {1: 0.8, 2: 1.0, 3: 1.2, 4: 1.3}[stage]
    # feet
    for x in (23, 34):
        c.shape(T([(x, 54), (x + 7, 54), (x + 8, 57), (x - 1, 57)]), p["beak"], shading=False)
    # body
    body = tf([(22, 36), (42, 36), (46, 44), (46, 53), (41, 56), (23, 56), (18, 53), (18, 44)], 1.0, bs, 0, 0, 32, 56)
    c.shape(T(body), p["body"])
    belly = tf([(26, 38), (38, 38), (41, 46), (40, 54), (24, 54), (23, 46)], 1.0, bs, 0, 0, 32, 56)
    c.shape(T(belly), p["belly"], outline=None)
    # flippers (flap)
    frot = [0, 2.5, 5.0][motion]
    fl = [(19, 40), (14, 44 - frot), (12, 50 - frot * 1.5), (16, 53), (20, 50)]
    c.shape(T(fl), p["dark"])
    c.shape(T(mirror(fl)), p["dark"])
    # head (part of the oval, drawn on top)
    head = [(20, 28), (22, 14), (30, 10), (34, 10), (42, 14), (44, 28), (42, 38), (22, 38)]
    c.shape(H(head), p["body"])
    face = [(22, 18), (42, 18), (44, 27), (40, 34), (24, 34), (20, 27)]
    c.shape(H(face), p["belly"], outline=None, shading=False)
    es = hs * s
    for ex in (23, 37):
        x, y = H([(ex, 22)])[0]
        eye(c, x, y, eyes, es)
    beak = [(29, 28), (35, 28), (32, 32)]
    c.shape(H(beak), p["beak"], shading=False)
    if eyes == "happy":
        for bx in (21, 40):
            x, y = H([(bx, 29)])[0]
            blush(c, x, y, p["blush"], es)
    if stage >= 3:  # crest feathers
        for sx_, w in ((26, 1.5), (36, 1.5)):
            x, y = H([(sx_, 11)])[0]
            c.rect(x, y - 3 * es, w * es, 3.5 * es, p["crest"])
            c.rect(x - 1 * es, y - 4 * es, 1 * es, 1.5 * es, p["crest"])
    if stage >= 4:
        for pt in H([(13, 12), (52, 12)]):
            star(c, pt[0], pt[1])
        c.shape(T([(24, 37), (40, 37), (40, 39.5), (24, 39.5)]), "#b8635a", outline=INK, shading=False)


# ------------------------------------------------------------------ Fern (forest sprite)
FERN = dict(body="#8fae74", dark="#5f8a4e", face="#eef2dc", leaf="#5f8a4e", leaf2="#9cc07a", blush="#d4b58f", bloom="#faf5e6")


def draw_fern(c: Canvas, stage: int, motion: int, eyes: str):
    p = FERN
    s, hs, T, H = transforms(stage, "fern")
    bs = {1: 0.85, 2: 1.0, 3: 1.1, 4: 1.18}[stage]
    # feet and arms
    for x in (22, 35):
        c.shape(T([(x, 53), (x + 7, 53), (x + 7, 57), (x, 57)]), p["dark"], shading=False)
    # one big round body that is also the head
    body = tf(round_body(32, 40, 16, 17), 1.0, bs, 0, 0, 32, 56)
    c.shape(T(body), p["body"])
    # arms
    c.shape(T([(16, 44), (20, 42), (21, 47), (17, 48)]), p["body"], shading=False)
    c.shape(T([(48, 44), (44, 42), (43, 47), (47, 48)]), p["body"], shading=False)
    # mossy texture
    for pt in T(tf([(20, 36), (44, 38), (24, 50), (41, 50), (33, 54)], 1.0, bs, 0, 0, 32, 56)):
        c.rect(pt[0], pt[1], 2 * s, 1 * s, p["dark"])
    # face patch
    face = [(22, 24), (42, 24), (46, 30), (44, 38), (38, 42), (26, 42), (20, 38), (18, 30)]
    c.shape(H(face), p["face"], outline=None)
    es = hs * s
    for ex in (23, 37):
        x, y = H([(ex, 28)])[0]
        eye(c, x, y, eyes, es)
    mx, my = H([(30, 36)])[0]
    if eyes == "happy":
        c.rect(mx, my, 5 * es, 1.5 * es, INK)
        c.rect(mx + 1 * es, my, 3 * es, 0.8 * es, "#c96a5a")
    else:
        c.rect(mx, my - 1 * es, 1 * es, 1 * es)
        c.rect(mx + 1 * es, my, 3 * es, 1 * es)
        c.rect(mx + 4 * es, my - 1 * es, 1 * es, 1 * es)
    for bx in (20.5, 40.5):
        x, y = H([(bx, 34)])[0]
        blush(c, x, y, p["blush"], es)
    # sprout on top, sways
    sdx = [0, 1.0, -1.0][motion]
    with c.part(sdx * s * hs, 0):
        top = H([(32, 24)])[0]
        c.rect(top[0] - 0.5 * es, top[1] - 7 * es, 1 * es, 7 * es, p["leaf"])
        leaf_l = [(32, 18), (27, 16), (24, 12), (29, 12), (32, 15)]
        leaf_r = [(32, 17), (36, 13), (41, 12), (40, 16), (35, 18)]
        c.shape(H(leaf_l), p["leaf2"])
        c.shape(H(leaf_r), p["leaf2"])
        if stage >= 3:
            c.shape(H([(32, 20), (28, 21), (26, 18), (30, 18)]), p["leaf2"])
        if stage >= 4:  # a small blossom
            c.shape(H(oval(33, 11, 2.5, 2.5, 10)), p["bloom"])
            c.rect(*H([(32.5, 10.5)])[0], 1 * es, 1 * es, "#e2c977")
    if stage >= 4:
        for pt in H([(10, 24), (54, 22)]):
            star(c, pt[0], pt[1])


# ------------------------------------------------------------------ eggs
EGGS = {
    "tofu": ("#f1e9d9", "#8f8b82", "spots"),
    "juno": ("#e9dfcf", "#8a7a6b", "speckles"),
    "pebble": ("#dfe9df", "#8db5ad", "wave"),
    "ori": ("#e8ecee", "#3f4650", "band"),
    "fern": ("#e6ecd6", "#8fae74", "leaf"),
}


def draw_egg(c: Canvas, pet: str, frame: str):
    base, mark, pattern = EGGS[pet]
    tilt = {"idle": 0, "wobble_l": -2.5, "wobble_r": 2.5, "crack1": 0, "crack2": 1.5, "crack3": -1.5}[frame]
    shell = [(27, 23), (35, 23), (41, 28), (45, 37), (45, 47), (40, 53), (23, 53), (18, 47), (18, 38), (22, 29)]
    a = math.radians(tilt)
    rot = [((x - 32) * math.cos(a) - (y - 53) * math.sin(a) + 32, (x - 32) * math.sin(a) + (y - 53) * math.cos(a) + 53) for x, y in shell]
    with c.part(0, 4):
        c.shape(rot, base)
        if pattern == "spots":
            for x, y, w in [(25, 32, 3), (35, 36, 3), (29, 44, 2)]:
                c.rect(x, y, w, w, mark)
        elif pattern == "speckles":
            for x, y in [(24, 30), (34, 28), (29, 36), (38, 40), (26, 44), (36, 47)]:
                c.rect(x, y, 1.5, 1.5, mark)
        elif pattern == "wave":
            for i, x in enumerate(range(20, 44, 3)):
                c.rect(x, 38 + (1.5 if i % 2 else 0), 3, 1.5, mark)
        elif pattern == "band":
            c.rect(19, 36, 26, 3, mark)
            c.rect(22, 42, 20, 1.5, mark)
        else:
            c.shape([(32, 30), (28, 34), (30, 40), (34, 40), (36, 34)], mark, outline=None)
            c.rect(31.5, 40, 1, 5, mark)
        if frame in ("crack1", "crack2", "crack3"):
            zig = [(30, 24), (28, 28), (31, 31), (29, 35)] if frame == "crack1" else [(30, 24), (27, 28), (31, 32), (28, 37), (33, 41), (30, 46)]
            for i in range(len(zig) - 1):
                (x0, y0), (x1, y1) = zig[i], zig[i + 1]
                for k in range(7):
                    c.rect(x0 + (x1 - x0) * k / 6, y0 + (y1 - y0) * k / 6, 0.5, 0.5, INK)
            if frame == "crack3":
                for x, y in [(36, 30), (38, 34), (36, 38)]:
                    c.rect(x, y, 0.5, 0.5, INK)
        star(c, 48, 24)
        c.rect(14, 34, 1, 1, "#e2c977")


# --------------------------------------------------------------- overlays

def draw_overlay(c: Canvas, pet: str, stage: int, kind: str):
    s, hs, T, H = transforms(stage, pet)
    a = ANCHORS[pet]
    hatY, faceY, neckY = a["hatY"], a["faceY"], a["neckY"]
    es = hs * s
    paper = "#fffef9"
    if kind == "hydration":
        drop = [(12, 44), (15, 49), (15, 52), (12, 54), (9, 52), (9, 49)]
        c.shape(T(tf(drop, 1, 1, 10, -2, 32, GROUND)), "#8fc3d8")
        pt = T([(22.5, 46)])[0]
        c.rect(pt[0], pt[1], 1 * s, 1.5 * s, paper)
        if stage >= 3:
            c.shape(H([(52, 13), (54, 17), (54, 19), (51, 21), (49, 19), (50, 16)]), "#8fc3d8")
        if stage >= 4:
            c.shape(H([(11, 16), (13, 19), (13, 21), (11, 23), (9, 21), (9, 18)]), "#8fc3d8")
    elif kind == "active":
        y = faceY - 4
        c.shape(H([(21, y), (43, y), (43, y + 2.5), (21, y + 2.5)]), "#c9684f", shading=False)
        pt = H([(22.5, y + 0.5)])[0]
        c.rect(pt[0], pt[1], 4 * es, 0.5 * es, "#f2b7a6")
        c.shape(H([(44, y), (49, y + 2), (48, y + 6), (44, y + 3)]), "#c9684f", shading=False)
        if stage >= 3:
            for wx in (17, 42):
                c.shape(T([(wx, 45), (wx + 5, 45), (wx + 5, 47), (wx, 47)]), "#c9684f", outline=INK, shading=False)
    elif kind == "nourished":
        stem = H([(32, hatY - 3)])[0]
        c.rect(stem[0], stem[1], 1 * es, 6 * es, "#5f7d4e")
        c.shape(H([(31, hatY - 2), (26, hatY - 3), (24, hatY - 7), (29, hatY - 6), (32, hatY - 3)]), "#8db46f")
        c.shape(H([(33, hatY - 3), (35, hatY - 8), (40, hatY - 9), (39, hatY - 5)]), "#8db46f")
        if stage >= 3:
            c.shape(T([(21, 44), (23, 41), (25, 44)]), "#8db46f")
    elif kind == "cap":
        crown = [(23, hatY - 4), (27, hatY - 8), (37, hatY - 8), (41, hatY - 4), (41, hatY), (23, hatY)]
        c.shape(H(crown), "#6f8a74")
        c.shape(H([(22, hatY), (47, hatY), (47, hatY + 2), (22, hatY + 2)]), "#4f6a58", shading=False)
        pt = H([(32, hatY - 6)])[0]
        c.rect(pt[0], pt[1], 1 * es, 4 * es, "#4f6a58")
    elif kind == "bow":
        bx = a["bowX"]
        bow = [(bx - 5, hatY), (bx - 1, hatY + 2), (bx + 4, hatY - 1), (bx + 5, hatY + 6), (bx, hatY + 4), (bx - 5, hatY + 6)]
        c.shape(H(bow), "#b8635a")
        pt = H([(bx - 1, hatY + 2)])[0]
        c.rect(pt[0], pt[1], 2 * es, 2 * es, "#f2c4bc")
    elif kind == "glasses":
        y = faceY - 1.5
        for x in (20, 35):
            c.shape(H([(x, y), (x + 10, y), (x + 10, y + 8), (x, y + 8)]), "#dbe7ef", outline=INK, shading=False)
            m = c.mask(H([(x + 1, y + 1), (x + 9, y + 1), (x + 9, y + 7), (x + 1, y + 7)]))
            ys, xs = m.nonzero()
            for yy, xx in zip(ys, xs):
                c.px[yy, xx] = (219, 231, 239, 70)
            pt = H([(x + 2, y + 2)])[0]
            c.rect(pt[0], pt[1], 2 * es, 0.5 * es, "#ffffff")
        pt = H([(30, y + 3)])[0]
        c.rect(pt[0], pt[1], 5 * es, 1 * es)
    elif kind == "scarf":
        c.shape(T([(22, neckY), (42, neckY), (42, neckY + 3), (22, neckY + 3)]), "#b8635a")
        c.shape(T([(36, neckY + 3), (42, neckY + 3), (43, neckY + 10), (37, neckY + 10)]), "#b8635a")
        for pt in T([(24, neckY + 1), (38, neckY + 7), (30, neckY + 1)]):
            c.rect(pt[0], pt[1], 2.5 * s, 1 * s, "#f0c7bf")
    elif kind == "crown":
        crown = [(25, hatY), (23, hatY - 7), (29, hatY - 4), (32, hatY - 9), (35, hatY - 4), (41, hatY - 7), (39, hatY)]
        c.shape(H(crown), "#e2b94f")
        pt = H([(26, hatY - 1)])[0]
        c.rect(pt[0], pt[1], 13 * es, 1 * es, "#b58b2a")
        pt = H([(31, hatY - 4)])[0]
        c.rect(pt[0], pt[1], 2 * es, 2 * es, "#8fc3d8")
        for pt in H([(27, hatY - 2), (36, hatY - 2)]):
            c.rect(pt[0], pt[1], 1 * es, 1 * es, "#b8635a")


DRAWERS = {"tofu": draw_tofu, "juno": draw_juno, "pebble": draw_pebble, "ori": draw_ori, "fern": draw_fern}
PETS = ["tofu", "juno", "pebble", "ori", "fern"]
