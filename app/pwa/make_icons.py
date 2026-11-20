"""Draw the app icons in app/pwa/icons:  python app/pwa/make_icons.py   (needs Pillow: pip install pillow)

The icon is the cusp y² = x³ (the points (t², ±t³)): two branches that leave the singular point (gold)
along one shared tangent (dashed), on the dark sky of the Learn map with a faint grid.
"""
import pathlib
from PIL import Image, ImageChops, ImageDraw, ImageFilter

OUT = pathlib.Path(__file__).with_name("icons"); OUT.mkdir(exist_ok=True)
SKY, GRID, INK, TAN, GOLD = (8, 12, 26), (32, 42, 66), (233, 236, 241), (112, 126, 156), (255, 207, 122)
T = 1.45                                  # draw t in [-T, T]: long enough to see the arms bend
X0, X1 = -0.75, T * T + 0.2               # the tangent line, in curve units
HEIGHT = 2 * T ** 3                       # height of the curve


def icon(size, name, fill=0.64, rounded=False):
    """fill: share of the icon's height the curve takes (maskable icons need a smaller one)."""
    S = size * 4                                             # draw big, then scale down: smooth edges
    im = Image.new("RGB", (S, S), SKY)
    d = ImageDraw.Draw(im)
    step = S / 12
    for i in range(1, 12):
        w = max(1, S // 260)
        d.line([(i * step, 0), (i * step, S)], fill=GRID, width=w)
        d.line([(0, i * step), (S, i * step)], fill=GRID, width=w)
    k = fill * S / HEIGHT                                    # pixels per curve unit
    cx = S / 2 - k * (X0 + X1) / 2                           # centre the picture (tangent included)
    cy = S / 2
    P = lambda x, y: (cx + k * x, cy - k * y)
    # dashed tangent
    dash, gap, x = 0.16, 0.12, X0
    while x < X1:
        d.line([P(x, 0), P(min(x + dash, X1), 0)], fill=TAN, width=max(2, int(S * 0.018)))
        x += dash + gap
    # glow behind the singular point
    glow = Image.new("RGB", (S, S), (0, 0, 0))
    r = S * 0.07
    ImageDraw.Draw(glow).ellipse([cx - r, cy - r, cx + r, cy + r], fill=(150, 100, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.04))
    im = ImageChops.add(im, glow)                            # light adds up, like a glow
    d = ImageDraw.Draw(im)
    # the two branches, as one curve through the cusp: stamped discs give a smooth, round-ended stroke
    e = S * 0.021
    for i in range(-3000, 3001):
        x, y = P((i / 3000 * T) ** 2, (i / 3000 * T) ** 3)
        d.ellipse([x - e, y - e, x + e, y + e], fill=INK)
    # the singular point
    rd = S * 0.034
    d.ellipse([cx - rd, cy - rd, cx + rd, cy + rd], fill=GOLD)
    if rounded:
        m = Image.new("L", (S, S), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
        im = im.convert("RGBA"); im.putalpha(m)
    im.resize((size, size), Image.LANCZOS).save(OUT / name)


icon(192, "icon-192.png"); icon(512, "icon-512.png")
icon(512, "icon-maskable-512.png", fill=0.5)                 # Android crops maskable icons to a circle
icon(180, "apple-touch-icon.png")
icon(64, "favicon-64.png", fill=0.7, rounded=True)
print("icons written to", OUT)
