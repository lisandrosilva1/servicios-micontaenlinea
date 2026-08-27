#!/usr/bin/env python3
"""Genera las imagenes de marca del sitio.

Por que existe: el og:image apuntaba a /logo.png, que NO existia (404). Sin esa
imagen, compartir el sitio por WhatsApp o Facebook no muestra vista previa, y
todo el embudo del negocio es WhatsApp. Estas imagenes se generan desde codigo
para que nunca vuelvan a faltar.

Uso:  python3 tools/gen-brand-images.py
Salida: og-image.png (1200x630), logo.png (512x512), favicon.ico
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRIMARY = (13, 90, 143)       # #0D5A8F
PRIMARY_LIGHT = (26, 124, 184)  # #1a7cb8
ACCENT = (255, 107, 53)       # #FF6B35
WHITE = (255, 255, 255)

F = "/System/Library/Fonts/Supplemental/"


def font(name, size):
    return ImageFont.truetype(F + name, size)


def gradient(w, h, top, bottom):
    img = Image.new("RGB", (w, h), top)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        d.line([(0, y), (w, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return img


def check_badge(size, bg, fg):
    """Circulo con palomita — la marca grafica del sitio."""
    ss = size * 4  # supersampling para bordes suaves
    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, ss - 1, ss - 1], fill=bg)
    w = int(ss * 0.09)
    d.line([(ss * 0.28, ss * 0.52), (ss * 0.44, ss * 0.68)], fill=fg, width=w)
    d.line([(ss * 0.44, ss * 0.68), (ss * 0.73, ss * 0.34)], fill=fg, width=w)
    d.ellipse([ss * 0.28 - w / 2, ss * 0.52 - w / 2, ss * 0.28 + w / 2, ss * 0.52 + w / 2], fill=fg)
    d.ellipse([ss * 0.73 - w / 2, ss * 0.34 - w / 2, ss * 0.73 + w / 2, ss * 0.34 + w / 2], fill=fg)
    return img.resize((size, size), Image.LANCZOS)


# ---------------------------------------------------------------- og-image
W, H = 1200, 630
og = gradient(W, H, PRIMARY, PRIMARY_LIGHT)
d = ImageDraw.Draw(og)

og.paste(check_badge(120, WHITE, PRIMARY), (90, 96), check_badge(120, WHITE, PRIMARY))

d.text((240, 118), "MiConta", font=font("Arial Bold.ttf", 64), fill=WHITE)
w1 = d.textlength("MiConta", font=font("Arial Bold.ttf", 64))
d.text((240 + w1, 118), "EnLinea", font=font("Arial Bold.ttf", 64), fill=(255, 196, 120))
w2 = d.textlength("EnLinea", font=font("Arial Bold.ttf", 64))
d.text((240 + w1 + w2, 118), ".mx", font=font("Arial Bold.ttf", 64), fill=WHITE)

d.text((90, 290), "Trámites del SAT en línea,", font=font("Arial Bold.ttf", 54), fill=WHITE)
d.text((90, 356), "en Los Cabos y todo México.", font=font("Arial Bold.ttf", 54), fill=WHITE)

d.text((90, 452), "Facturación CFDI  ·  Declaraciones mensuales  ·  Cambio de régimen",
       font=font("Arial.ttf", 27), fill=(206, 228, 244))

# Badge de precio
bx, by = 90, 512
label = "Pago único desde $189 MXN"
tw = d.textlength(label, font=font("Arial Bold.ttf", 29))
d.rounded_rectangle([bx, by, bx + tw + 56, by + 62], radius=31, fill=ACCENT)
d.text((bx + 28, by + 15), label, font=font("Arial Bold.ttf", 29), fill=WHITE)

og.save(ROOT / "og-image.png", "PNG", optimize=True)

# ---------------------------------------------------------------- logo
logo = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
logo.paste(check_badge(512, PRIMARY, WHITE), (0, 0))
logo.save(ROOT / "logo.png", "PNG", optimize=True)

# ---------------------------------------------------------------- favicon
fav = check_badge(256, PRIMARY, WHITE).convert("RGBA")
fav.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

print("OK: og-image.png (1200x630), logo.png (512x512), favicon.ico")
