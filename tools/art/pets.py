"""
Pet sprite definitions for Foxi, Lumi and Drako across five growth stages.

Every stage is built from parts (head, body, tail, wings...) that are
scaled and repositioned per stage, with stage-specific extra details so the
growth feels like real change rather than a bigger copy.
"""
from __future__ import annotations

from pixel import INK, Canvas, mirror, tf

GROUND = 57.0  # unit y of the floor line

# ---------------------------------------------------------------- palettes
FOXI = dict(fur="#d4864a", cream="#f4e9d6", dark="#4a342a", nose="#2a2823", inner="#b9674a")
LUMI = dict(fur="#efe8da", cream="#faf7f0", dark="#c7bba6", inner="#d9ad9d", nose="#2a2823")
DRAKO = dict(fur="#6e9c8c", cream="#e6dcb9", dark="#4f7367", inner="#55806f", horn="#e0d6bd", spike="#4f7266", nose="#2a2823")

EYE_HI = "#ffffff"
EYE_SOFT = "#9aa3a0"

# ------------------------------------------------------------------ helpers

def eye(c: Canvas, x: float, y: float, mode: str, scale: float = 1.0):
    """Draws an eye whose top-left corner is at (x, y). 4x5 units at scale 1."""
    w, h = 4 * scale, 5 * scale
    if mode == "happy":
        c.rect(x, y + 2 * scale, 1 * scale, 2 * scale)
        c.rect(x + 1 * scale, y + 1 * scale, 2 * scale, 1 * scale)
        c.rect(x + 3 * scale, y + 2 * scale, 1 * scale, 2 * scale)
        return
    if mode == "blink":
        c.rect(x, y + 3 * scale, w, 1 * scale)
        return
    c.rect(x, y, w, h)
    c.rect(x, y, 0.5 * scale, 1.5 * scale, EYE_HI)
    c.rect(x + 0.5 * scale, y + 0.5 * scale, 1 * scale, 1 * scale, EYE_HI)
    c.rect(x + 2.5 * scale, y + 3.5 * scale, 0.5 * scale, 0.5 * scale, EYE_SOFT)
    c.rect(x + 1 * scale, y + 5 * scale, 2 * scale, 0.5 * scale)


def star(c: Canvas, x: float, y: float, color: str = "#e2c977"):
    c.rect(x, y - 2, 1, 5, color)
    c.rect(x - 2, y, 5, 1, color)
    c.rect(x, y, 1, 1, "#fff6d6")


# ------------------------------------------------------------------ Foxi

FOXI_TAIL = [(37, 50), (46, 49), (49, 45), (48, 37), (51, 30), (58, 27), (57, 38), (60, 44), (58, 51), (52, 56), (42, 56)]
FOXI_TAIL_TIP = [(50, 34), (52, 30), (58, 27), (57, 38), (59, 43), (55, 41), (52, 43), (53, 38)]
FOXI_BODY = [(25, 39), (39, 39), (43, 46), (42, 53), (37, 56), (23, 55), (20, 49)]
FOXI_CHEST = [(25, 39), (38, 39), (37, 44), (33, 48), (29, 45), (27, 46), (25, 43)]
FOXI_HEAD = [(19, 24), (17, 12), (18, 7), (25, 12), (29, 20), (36, 20), (42, 12), (47, 8), (48, 23), (51, 28), (49, 31), (52, 33), (47, 36), (46, 39), (36, 43), (27, 42), (19, 38), (14, 34), (17, 31), (14, 29)]
FOXI_EAR_L = [(20, 13), (24, 17), (25, 22), (21, 24)]
FOXI_EAR_R = [(44, 14), (46, 12), (45, 23), (40, 23)]
FOXI_MUZZLE = [(19, 32), (23, 33), (28, 36), (32, 38), (37, 35), (42, 32), (47, 32), (46, 37), (38, 41), (27, 40), (21, 37)]
FOXI_PAW_L = [(21, 53), (29, 53), (30, 56), (20, 56)]
FOXI_PAW_R = [(34, 53), (41, 53), (43, 56), (34, 56)]


def draw_foxi(c: Canvas, stage: int, motion: int, eyes: str, tail: bool = True):
    p = FOXI
    # Stage poses: (scale of everything, head scale, head lift, body stretch, tail scale)
    if stage == 1:  # baby: big head, tiny body
        s, hs, lift, bs, ts = 0.62, 1.25, 2, 0.75, 0.7
    elif stage == 2:  # teen
        s, hs, lift, bs, ts = 0.88, 1.0, 0, 1.0, 1.0
    elif stage == 3:  # adult: longer body, slightly smaller head
        s, hs, lift, bs, ts = 0.98, 0.96, -5, 1.2, 1.05
    else:  # companion
        s, hs, lift, bs, ts = 1.0, 0.94, -7, 1.3, 1.15
    shift = -2.5 if stage >= 4 else (-1.0 if stage == 3 else 0.0)
    T = lambda pts, sx=1.0, sy=None, ox=0.0, oy=0.0, cx=32.0, cy=GROUND: tf(pts, sx * s, (sy if sy is not None else sx) * s, ox * s + shift, oy * s, cx, cy)
    tail_dx = [0, 1.2, -1.2][motion]
    tail_dy = [0, -0.6, 0.4][motion]
    # tail (behind body), scaled about its root near (40, 54)
    with c.part(tail_dx * s, tail_dy * s if tail else 0):
      if tail:
          tail = tf(FOXI_TAIL, ts, ts, 0, 0, 40, 54)
          tip = tf(FOXI_TAIL_TIP, ts, ts, 0, 0, 40, 54)
          c.shape(T(tail), p["fur"])
          c.shape(T(tip), p["cream"])
          for i in range(5):
              c.rect(*T([(48 + i, 50 - i)])[0], 1 * s, 1 * s, p["dark"] if stage >= 3 else INK)
          if stage >= 4:  # companion: second cream tuft and a dark stripe band
              c.shape(T(tf([(44, 45), (48, 42), (50, 46), (46, 50)], ts, ts, 0, 0, 40, 54)), p["cream"], outline=None)
    # body
    body = tf(FOXI_BODY, 1.0, bs, 0, 0, 32, 56)
    chest = tf(FOXI_CHEST, 1.0, bs, 0, 0, 32, 56)
    c.shape(T(body), p["fur"])
    c.shape(T(chest), p["cream"])
    if stage >= 3:
        # longer legs: a darker sock on each leg
        c.shape(T([(22, 50), (29, 50), (29, 54), (22, 54)]), p["dark"], outline=None, shading=False)
        c.shape(T([(34, 50), (41, 50), (41, 54), (34, 54)]), p["dark"], outline=None, shading=False)
    c.rect(*T([(25, 49)])[0], 1 * s, 4 * s)
    c.rect(*T([(36, 49)])[0], 1 * s, 4 * s)
    c.shape(T(FOXI_PAW_L), p["dark"] if stage >= 2 else p["fur"])
    c.shape(T(FOXI_PAW_R), p["dark"] if stage >= 2 else p["fur"])
    # head group: scale about head centre (32, 28) then lift
    H = lambda pts: T(tf(pts, hs, hs, 0, lift, 32, 30))
    c.shape(H(FOXI_HEAD), p["fur"])
    c.shape(H(FOXI_EAR_L), p["dark"], shading=False)
    c.shape(H(FOXI_EAR_R), p["dark"], shading=False)
    c.shape(H(FOXI_MUZZLE), p["cream"])
    if stage >= 3:  # cheek fur marks
        for pt in H([(16, 29), (17, 30), (48, 26), (49, 27)]):
            c.rect(pt[0], pt[1], 1 * s, 0.5 * s, p["dark"])
    es = hs * s
    ex, ey = H([(23, 28)])[0]
    eye(c, ex, ey, eyes, es)
    ex, ey = H([(38, 28)])[0]
    eye(c, ex, ey, eyes, es)
    nx, ny = H([(30, 35)])[0]
    c.rect(nx, ny, 4 * es, 2 * es, p["nose"])
    c.rect(nx + 1 * es, ny + 2 * es, 2 * es, 2 * es, p["nose"])
    if eyes == "happy":
        mx, my = H([(29, 39)])[0]
        c.rect(mx, my, 7 * es, 1.5 * es, p["nose"])
        c.rect(mx + 1.5 * es, my, 4 * es, 1 * es, "#c96a5a")
    else:
        mx, my = H([(28, 39)])[0]
        c.rect(mx, my, 3 * es, 1 * es)
        mx, my = H([(33, 39)])[0]
        c.rect(mx, my, 3 * es, 1 * es)
    wx, wy = H([(20, 35)])[0]
    c.rect(wx, wy, 2 * es, 1 * es)
    wx, wy = H([(42, 35)])[0]
    c.rect(wx, wy, 2 * es, 1 * es)
    # fur highlights
    for pt in H([(26, 21), (29, 22), (38, 23)]):
        c.rect(pt[0], pt[1], 1.5 * es, 0.5 * es, "#f0c79a")
    if stage >= 4:
        for pt in H([(14, 20), (50, 17)]):
            star(c, pt[0], pt[1])


FOXI_ANCHORS = dict(hatY=20, faceY=29, neckY=41, charm=(12, 48), charm2=(51, 16))


def foxi_pose(stage: int):
    if stage == 1:
        return 0.62, 1.25, 2
    if stage == 2:
        return 0.88, 1.0, 0
    if stage == 3:
        return 1.0, 0.96, -5
    return 1.06, 0.94, -8


# ------------------------------------------------------------------ Lumi

LUMI_TAIL = [(40, 44), (46, 43), (49, 47), (48, 51), (43, 53), (40, 50)]
LUMI_BODY = [(23, 40), (39, 40), (43, 47), (41, 54), (35, 56), (26, 55), (21, 51)]
LUMI_EAR_UP = [(23, 26), (20, 20), (21, 10), (24, 4), (28, 3), (30, 7), (29, 20), (28, 26)]
LUMI_EAR_FOLD = [(35, 25), (36, 14), (39, 8), (44, 8), (48, 13), (48, 21), (45, 24), (42, 22), (42, 15), (40, 22), (40, 27)]
LUMI_HEAD = [(24, 23), (38, 23), (43, 26), (46, 32), (45, 37), (41, 41), (35, 43), (25, 42), (19, 39), (17, 34), (19, 28)]
LUMI_ARM_L = [(24, 45), (27, 45), (28, 50), (25, 51)]
LUMI_ARM_R = [(36, 45), (39, 45), (38, 51), (35, 50)]
LUMI_FOOT_L = [(22, 52), (29, 52), (31, 55), (29, 57), (21, 57), (20, 55)]
LUMI_FOOT_R = [(35, 52), (42, 53), (44, 56), (41, 57), (34, 57), (33, 55)]


def draw_lumi(c: Canvas, stage: int, motion: int, eyes: str):
    p = LUMI
    if stage == 1:
        s, hs, lift, bs, es_ = 0.62, 1.25, 1, 0.8, 0.9
    elif stage == 2:
        s, hs, lift, bs, es_ = 0.88, 1.0, 0, 1.0, 1.0
    elif stage == 3:
        s, hs, lift, bs, es_ = 0.98, 0.96, -4, 1.25, 1.1
    else:
        s, hs, lift, bs, es_ = 1.0, 0.94, -6, 1.35, 1.18
    T = lambda pts, sx=1.0, sy=None, ox=0.0, oy=0.0, cx=32.0, cy=GROUND: tf(pts, sx * s, (sy if sy is not None else sx) * s, ox * s, oy * s, cx, cy)
    H = lambda pts: T(tf(pts, hs, hs, 0, lift, 32, 33))
    # tail puff
    c.shape(T(LUMI_TAIL), p["cream"])
    # body
    c.shape(T(tf(LUMI_BODY, 1.0, bs, 0, 0, 32, 56)), p["fur"])
    # belly patch
    c.shape(T(tf([(27, 44), (37, 44), (38, 50), (34, 54), (28, 54), (26, 50)], 1.0, bs, 0, 0, 32, 56)), p["cream"], outline=None)
    # ears (scaled about head, extra length by stage)
    ear_dx = [0, -1.0, 0][motion]
    ear_dy = [0, 0, -1.0][motion]
    with c.part(ear_dx * s, 0):
        up = tf(LUMI_EAR_UP, 1.0, es_, 0, 0, 26, 26)
        c.shape(H(up), p["fur"])
        inner = tf([(24, 10), (26, 8), (27, 20), (24.5, 21)], 1.0, es_, 0, 0, 26, 26)
        c.shape(H(inner), p["inner"], outline=None, shading=False)
    with c.part(0, ear_dy * s):
        fold = tf(LUMI_EAR_FOLD, 1.0, es_, 0, 0, 40, 26)
        c.shape(H(fold), p["fur"])
        inner2 = tf([(40, 12), (43, 12), (44, 20), (41.5, 21)], 1.0, es_, 0, 0, 40, 26)
        c.shape(H(inner2), p["inner"], outline=None, shading=False)
    # head
    c.shape(H(LUMI_HEAD), p["fur"])
    es = hs * s
    ex, ey = H([(24, 30)])[0]
    eye(c, ex, ey, eyes, es)
    ex, ey = H([(37, 30)])[0]
    eye(c, ex, ey, eyes, es)
    nx, ny = H([(30, 36)])[0]
    c.rect(nx, ny, 4 * es, 2 * es, p["nose"])
    c.rect(nx + 1 * es, ny + 2 * es, 1 * es, 1 * es, p["nose"])
    if eyes == "happy":
        mx, my = H([(29, 39)])[0]
        c.rect(mx, my, 6 * es, 1.5 * es, p["nose"])
        c.rect(mx + 1.5 * es, my, 3 * es, 1 * es, "#c96a5a")
    else:
        mx, my = H([(29, 39)])[0]
        c.rect(mx, my, 2 * es, 1 * es)
        mx, my = H([(32, 39)])[0]
        c.rect(mx, my, 2 * es, 1 * es)
    # cheek freckles
    for pt in H([(21, 35), (24, 36), (39, 35), (37, 36)]):
        c.rect(pt[0], pt[1], 1 * es, 1 * es, p["dark"])
    if stage >= 3:  # adult: chest fluff tufts
        for pt in T([(27, 43), (31, 42), (35, 43)]):
            c.rect(pt[0], pt[1], 1 * s, 1 * s, p["cream"])
    # arms & feet
    c.shape(T(LUMI_ARM_L), p["fur"])
    c.shape(T(LUMI_ARM_R), p["fur"])
    c.shape(T(LUMI_FOOT_L), p["fur"])
    c.shape(T(LUMI_FOOT_R), p["fur"])
    for pt in T([(24, 55), (26, 55), (37, 55), (39, 55)]):
        c.rect(pt[0], pt[1], 1 * s, 1 * s, p["dark"])
    if stage >= 4:
        for pt in H([(16, 16), (50, 12)]):
            star(c, pt[0], pt[1])


# ------------------------------------------------------------------ Drako

DRAKO_TAIL = [(40, 49), (47, 49), (52, 44), (52, 38), (55, 41), (57, 46), (54, 52), (49, 55), (40, 56)]
DRAKO_TAIL_TIP = [(51, 40), (50, 35), (54, 36), (56, 40)]
DRAKO_WING_L = [(23, 34), (17, 28), (10, 27), (11, 35), (8, 40), (16, 39), (20, 43), (25, 43)]
DRAKO_WING_R = [(39, 33), (45, 26), (53, 25), (52, 33), (56, 38), (48, 38), (43, 43), (38, 42)]
DRAKO_BODY = [(25, 34), (38, 34), (43, 42), (44, 51), (40, 56), (25, 56), (20, 51), (21, 43)]
DRAKO_BELLY = [(29, 41), (35, 41), (39, 47), (38, 54), (27, 54), (25, 50), (26, 45)]
DRAKO_HEAD = [(22, 25), (22, 19), (25, 15), (26, 10), (30, 14), (35, 14), (39, 9), (41, 16), (44, 20), (44, 29), (47, 32), (45, 37), (39, 40), (25, 38), (20, 33), (19, 29)]
DRAKO_SNOUT = [(29, 31), (43, 31), (46, 34), (43, 38), (30, 38), (27, 35)]
DRAKO_ARM_L = [(19, 42), (23, 41), (26, 45), (24, 48), (20, 46)]
DRAKO_ARM_R = [(40, 41), (44, 41), (46, 45), (43, 48), (40, 46)]
DRAKO_FOOT_L = [(22, 53), (29, 53), (30, 57), (20, 57), (19, 55)]
DRAKO_FOOT_R = [(36, 53), (43, 53), (45, 56), (43, 57), (35, 57)]


def draw_drako(c: Canvas, stage: int, motion: int, eyes: str):
    p = DRAKO
    if stage == 1:
        s, hs, lift, bs, ws = 0.62, 1.25, 2, 0.8, 0.0
    elif stage == 2:
        s, hs, lift, bs, ws = 0.88, 1.0, 0, 1.0, 0.8
    elif stage == 3:
        s, hs, lift, bs, ws = 0.98, 0.96, -5, 1.2, 1.1
    else:
        s, hs, lift, bs, ws = 1.0, 0.94, -7, 1.3, 1.3
    T = lambda pts, sx=1.0, sy=None, ox=0.0, oy=0.0, cx=32.0, cy=GROUND: tf(pts, sx * s, (sy if sy is not None else sx) * s, ox * s, oy * s, cx, cy)
    H = lambda pts: T(tf(pts, hs, hs, 0, lift, 32, 27))
    # tail
    c.shape(T(DRAKO_TAIL), p["fur"])
    c.shape(T(DRAKO_TAIL_TIP), p["spike"], shading=False)
    for pt in T([(47, 50), (49, 48)]):
        c.rect(pt[0], pt[1], 2 * s, 0.5 * s, p["dark"])
    # wings (behind body). Baby has nubs, later stages flap.
    wing_dy = [0, -1.5, -3.0][motion]
    if stage == 1:
        c.shape(T([(22, 36), (18, 32), (17, 37), (21, 41)]), p["inner"])
        c.shape(T([(40, 35), (45, 31), (46, 36), (42, 40)]), p["inner"])
    else:
        with c.part(0, wing_dy * s):
            wl = tf(DRAKO_WING_L, ws, ws, 0, (ws - 1) * -4, 23, 40)
            wr = tf(DRAKO_WING_R, ws, ws, 0, (ws - 1) * -4, 40, 40)
            # tilt wing tips with the flap
            tip = [0, -1.0, -2.5][motion]
            wl = [(x, y + (tip if x < 15 else 0)) for x, y in wl]
            wr = [(x, y + (tip if x > 48 else 0)) for x, y in wr]
            c.shape(T(wl), p["inner"])
            c.shape(T(wr), p["inner"])
            # membrane ribs
            for pt in T(tf([(13, 31), (48, 30)], ws, ws, 0, (ws - 1) * -4, 32, 40)):
                c.rect(pt[0], pt[1], 1 * s, 6 * s * ws, p["dark"])
            for pt in T(tf([(14, 35), (44, 34)], ws, ws, 0, (ws - 1) * -4, 32, 40)):
                c.rect(pt[0], pt[1], 5.5 * s * ws, 1 * s, p["dark"])
    # body + belly plates
    c.shape(T(tf(DRAKO_BODY, 1.0, bs, 0, 0, 32, 56)), p["fur"])
    belly = tf(DRAKO_BELLY, 1.0, bs, 0, 0, 32, 56)
    c.shape(T(belly), p["cream"])
    for yy in [48, 51] + ([45] if stage >= 3 else []):
        pt = T(tf([(28, yy)], 1.0, bs, 0, 0, 32, 56))[0]
        c.rect(pt[0], pt[1], 8 * s, 1 * s, p["dark"])
    # back spikes for adult+
    if stage >= 3:
        for sx_, sy_ in [(27, 33), (31, 31), (35, 33)]:
            pt = H([(sx_, sy_ + 1)])[0]
            c.shape([(pt[0], pt[1]), (pt[0] + 1.5 * s, pt[1] - 3 * s), (pt[0] + 3 * s, pt[1])], p["spike"], outline=INK, shading=False)
    # head
    c.shape(H(DRAKO_HEAD), p["fur"])
    # horns
    c.shape(H([(25, 15), (26, 8 if stage >= 3 else 10), (30, 14)]), p["horn"])
    c.shape(H([(35, 14), (39, 7 if stage >= 3 else 9), (41, 16)]), p["horn"])
    es = hs * s
    ex, ey = H([(25, 24)])[0]
    eye(c, ex, ey, eyes, es)
    ex, ey = H([(37, 24)])[0]
    eye(c, ex, ey, eyes, es)
    c.shape(H(DRAKO_SNOUT), p["cream"])
    for pt in H([(32, 33), (41, 33)]):
        c.rect(pt[0], pt[1], 1 * es, 1 * es, p["nose"])
    mx, my = H([(33, 36)])[0]
    if eyes == "happy":
        c.rect(mx, my, 7 * es, 1.5 * es, p["nose"])
        c.rect(mx + 1 * es, my + 0.5 * es, 2 * es, 1 * es, "#c96a5a")
    else:
        c.rect(mx, my, 7 * es, 1 * es)
        c.rect(mx + 4 * es, my + 1 * es, 2 * es, 1 * es, p["cream"])
    # arms and feet
    c.shape(T(DRAKO_ARM_L), p["fur"])
    c.shape(T(DRAKO_ARM_R), p["fur"])
    c.shape(T(DRAKO_FOOT_L), p["fur"])
    c.shape(T(DRAKO_FOOT_R), p["fur"])
    for pt in T([(23, 55), (26, 55), (38, 55), (41, 55)]):
        c.rect(pt[0], pt[1], 1 * s, 1 * s, p["dark"])
    for pt in H([(28, 19), (38, 20)]):
        c.rect(pt[0], pt[1], 2 * es, 1 * es, p["dark"])
    if stage >= 4:
        for pt in H([(14, 14), (52, 10)]):
            star(c, pt[0], pt[1])


# ------------------------------------------------------------------ eggs

def draw_egg(c: Canvas, pet: str, frame: str):
    base = {"foxi": "#f1dcc3", "lumi": "#f3efe6", "drako": "#cfdccf"}[pet]
    mark = {"foxi": "#d4864a", "lumi": "#d9ad9d", "drako": "#6e9c8c"}[pet]
    tilt = {"idle": 0, "wobble_l": -2.5, "wobble_r": 2.5, "crack1": 0, "crack2": 1.5, "crack3": -1.5}[frame]
    shell = [(27, 23), (35, 23), (41, 28), (45, 37), (45, 47), (40, 53), (23, 53), (18, 47), (18, 38), (22, 29)]
    shell = tf(shell, 1.0, 1.0, 0, 0, 32, 53)
    # rotate about the base for wobble
    import math

    a = math.radians(tilt)
    rot = [((x - 32) * math.cos(a) - (y - 53) * math.sin(a) + 32, (x - 32) * math.sin(a) + (y - 53) * math.cos(a) + 53) for x, y in shell]
    with c.part(0, 4):
        c.shape(rot, base)
        # markings
        if pet == "foxi":
            for x, y, w in [(25, 32, 3), (35, 36, 3), (29, 44, 2)]:
                c.rect(x, y, w, w, mark)
        elif pet == "lumi":
            for x, y in [(24, 30), (34, 30), (29, 42)]:
                c.rect(x, y, 2, 5, mark)
        else:
            c.shape([(31, 29), (35, 34), (31, 38), (27, 34)], mark, outline=None)
            c.rect(24, 44, 3, 2, mark)
            c.rect(37, 42, 3, 2, mark)
        # cracks
        if frame in ("crack1", "crack2", "crack3"):
            zig = [(30, 24), (28, 28), (31, 31), (29, 35)] if frame == "crack1" else [(30, 24), (27, 28), (31, 32), (28, 37), (33, 41), (30, 46)]
            for i in range(len(zig) - 1):
                (x0, y0), (x1, y1) = zig[i], zig[i + 1]
                steps = 6
                for k in range(steps + 1):
                    c.rect(x0 + (x1 - x0) * k / steps, y0 + (y1 - y0) * k / steps, 0.5, 0.5, INK)
            if frame == "crack3":
                for x, y in [(36, 30), (38, 34), (36, 38)]:
                    c.rect(x, y, 0.5, 0.5, INK)
        star(c, 48, 24)
        c.rect(14, 34, 1, 1, "#e2c977")


# --------------------------------------------------------------- overlays

def pose(pet: str, stage: int):
    """(scale, head scale, head lift, x shift) for a stage, mirroring draw_* functions."""
    if stage == 1:
        return 0.62, 1.25, (1 if pet == "lumi" else 2), 0.0
    if stage == 2:
        return 0.88, 1.0, 0, 0.0
    if stage == 3:
        return 0.98, 0.96, (-4 if pet == "lumi" else -5), (-1.0 if pet == "foxi" else 0.0)
    return 1.0, 0.94, (-6 if pet == "lumi" else -7), (-2.5 if pet == "foxi" else 0.0)


HEAD_PIVOT = {"foxi": (32, 30), "lumi": (32, 33), "drako": (32, 27)}
ANCHORS = {
    "foxi": dict(hatY=20, faceY=29, neckY=42, bowX=44),
    "lumi": dict(hatY=23, faceY=31, neckY=43, bowX=46),
    "drako": dict(hatY=14, faceY=25, neckY=38, bowX=42),
}


def draw_overlay(c: Canvas, pet: str, stage: int, kind: str):
    s, hs, lift, shift = pose(pet, stage)
    px, py = HEAD_PIVOT[pet]
    a = ANCHORS[pet]
    hatY, faceY, neckY = a["hatY"], a["faceY"], a["neckY"]
    T = lambda pts: tf(pts, s, s, shift, 0, 32, GROUND)
    H = lambda pts: T(tf(pts, hs, hs, 0, lift, px, py))
    es = hs * s
    paper = "#fffef9"
    if kind == "hydration":
        # water-drop charm on a cord by the chest, plus an orbiting drop at adult+
        drop = [(12, 44), (15, 49), (15, 52), (12, 54), (9, 52), (9, 49)]
        c.shape(T(tf(drop, 1, 1, 14, -2, 32, GROUND)), "#8fc3d8")
        pt = T([(26.5, 46)])[0]
        c.rect(pt[0], pt[1], 1 * s, 1.5 * s, paper)
        if stage >= 3:
            c.shape(H([(51, 13), (53, 17), (53, 19), (50, 21), (48, 19), (49, 16)]), "#8fc3d8")
        if stage >= 4:
            c.shape(H([(12, 16), (14, 19), (14, 21), (12, 23), (10, 21), (10, 18)]), "#8fc3d8")
    elif kind == "active":
        y = faceY - 4
        band = [(22, y), (42, y), (42, y + 2), (22, y + 2)]
        c.shape(H(band), "#c9684f", shading=False)
        pt = H([(23.5, y + 0.5)])[0]
        c.rect(pt[0], pt[1], 4 * es, 0.5 * es, "#f2b7a6")
        knot = [(43, y), (48, y + 2), (47, y + 6), (43, y + 3)]
        c.shape(H(knot), "#c9684f", shading=False)
        if stage >= 3:  # wrist wraps
            for wx in (20, 41):
                c.shape(T([(wx, 44), (wx + 5, 44), (wx + 5, 46), (wx, 46)]), "#c9684f", outline=INK, shading=False)
    elif kind == "nourished":
        stem = H([(32, hatY - 3)])[0]
        c.rect(stem[0], stem[1], 1 * es, 6 * es, "#5f7d4e")
        leaf1 = [(31, hatY - 2), (26, hatY - 3), (24, hatY - 7), (29, hatY - 6), (32, hatY - 3)]
        leaf2 = [(33, hatY - 3), (35, hatY - 8), (40, hatY - 9), (39, hatY - 5)]
        c.shape(H(leaf1), "#8db46f")
        c.shape(H(leaf2), "#8db46f")
        if stage >= 3:  # a small sprout at the collar
            c.shape(T([(22, 43), (24, 40), (26, 43)]), "#8db46f")
    elif kind == "cap":
        crown = [(23, hatY - 4), (27, hatY - 8), (36, hatY - 8), (40, hatY - 4), (40, hatY), (23, hatY)]
        c.shape(H(crown), "#6f8a74")
        brim = [(22, hatY), (46, hatY), (46, hatY + 2), (22, hatY + 2)]
        c.shape(H(brim), "#4f6a58", shading=False)
        pt = H([(32, hatY - 6)])[0]
        c.rect(pt[0], pt[1], 1 * es, 4 * es, "#4f6a58")
    elif kind == "bow":
        bx = a["bowX"]
        bow = [(bx - 5, hatY), (bx - 1, hatY + 2), (bx + 4, hatY - 1), (bx + 5, hatY + 6), (bx, hatY + 4), (bx - 5, hatY + 6)]
        c.shape(H(bow), "#b8635a")
        pt = H([(bx - 1, hatY + 2)])[0]
        c.rect(pt[0], pt[1], 2 * es, 2 * es, "#f2c4bc")
    elif kind == "glasses":
        y = faceY - 1
        for x in (22, 35):
            frame = [(x, y), (x + 10, y), (x + 10, y + 8), (x, y + 8)]
            c.shape(H(frame), "#dbe7ef", outline=INK, shading=False)
            inner = [(x + 1, y + 1), (x + 9, y + 1), (x + 9, y + 7), (x + 1, y + 7)]
            m = c.mask(H(inner))
            # make the lens translucent: clear the interior, keep a glint
            ys, xs = m.nonzero()
            for yy, xx in zip(ys, xs):
                c.px[yy, xx] = (219, 231, 239, 70)
            pt = H([(x + 2, y + 2)])[0]
            c.rect(pt[0], pt[1], 2 * es, 0.5 * es, "#ffffff")
        pt = H([(32, y + 3)])[0]
        c.rect(pt[0], pt[1], 3 * es, 1 * es)
    elif kind == "scarf":
        band = [(23, neckY), (40, neckY), (40, neckY + 3), (23, neckY + 3)]
        c.shape(T(band), "#b8635a")
        tail = [(35, neckY + 3), (40, neckY + 3), (41, neckY + 10), (36, neckY + 10)]
        c.shape(T(tail), "#b8635a")
        for pt in T([(25, neckY + 1), (37, neckY + 7)]):
            c.rect(pt[0], pt[1], 2 * s, 1 * s, "#f0c7bf")
        pt = T([(30, neckY + 1)])[0]
        c.rect(pt[0], pt[1], 3 * s, 1 * s, "#f0c7bf")
    elif kind == "crown":
        crown = [(25, hatY), (23, hatY - 7), (29, hatY - 4), (32, hatY - 9), (35, hatY - 4), (41, hatY - 7), (39, hatY)]
        c.shape(H(crown), "#e2b94f")
        pt = H([(26, hatY - 1)])[0]
        c.rect(pt[0], pt[1], 13 * es, 1 * es, "#b58b2a")
        pt = H([(31, hatY - 4)])[0]
        c.rect(pt[0], pt[1], 2 * es, 2 * es, "#8fc3d8")
        for pt in H([(27, hatY - 2), (36, hatY - 2)]):
            c.rect(pt[0], pt[1], 1 * es, 1 * es, "#b8635a")


DRAWERS = {"foxi": draw_foxi, "lumi": draw_lumi, "drako": draw_drako}
