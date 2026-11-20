"""Generate the PWA icons in app/pwa/icons (run once; needs Pillow and the DejaVu font)."""
import pathlib
from PIL import Image, ImageDraw, ImageFont
OUT = pathlib.Path(__file__).with_name("icons"); OUT.mkdir(exist_ok=True)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
BG, PAPER, QED = (31, 122, 74), (233, 236, 241), (255, 196, 87)
GLYPH = "C"   # the app's initial
GRID = tuple(round(b * 0.88 + 255 * 0.12) for b in BG)

def icon(size, name, maskable=False, rounded=False):
    S = size * 4
    im = Image.new("RGB", (S, S), BG); d = ImageDraw.Draw(im)
    step = S / 12
    for i in range(1, 12):
        w = max(1, S // 300)
        d.line([(i * step, 0), (i * step, S)], fill=GRID, width=w); d.line([(0, i * step), (S, i * step)], fill=GRID, width=w)
    f = ImageFont.truetype(FONT, int(S * (0.5 if maskable else 0.64)))
    bb = d.textbbox((0, 0), GLYPH, font=f)
    q = (bb[3] - bb[1]) * 0.13
    x = (S - (bb[2] - bb[0]) - q * 1.6) / 2 - bb[0]; y = (S - (bb[3] - bb[1])) / 2 - bb[1]
    d.text((x, y), GLYPH, font=f, fill=PAPER)
    qx = x + bb[2] + q * 0.6; qy = y + bb[3] - q
    d.rectangle([qx, qy, qx + q, qy + q], fill=QED)
    if rounded:
        m = Image.new("L", (S, S), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
        im = im.convert("RGBA"); im.putalpha(m)
    im.resize((size, size), Image.LANCZOS).save(OUT / name)

icon(192, "icon-192.png"); icon(512, "icon-512.png")
icon(512, "icon-maskable-512.png", maskable=True)
icon(180, "apple-touch-icon.png")
icon(64, "favicon-64.png", rounded=True)
