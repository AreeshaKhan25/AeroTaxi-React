"""
Generates the AeroTAXI icon set from one geometry definition.

The mark is a bold "A" (outer triangle minus an inner triangle, so the
crossbar falls out of the geometry) on a rounded navy square. It is defined
once here and emitted both as SVG and as raster PNG/ICO, so the vector and
the bitmaps can never drift apart.

    python scripts/generate-icons.py
"""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

NAVY = (12, 98, 145)        # primary.DEFAULT  #0C6291
NAVY_DEEP = (17, 75, 111)   # primary.800      #114B6F
YELLOW = (250, 204, 21)     # accent.DEFAULT   #FACC15
WHITE = (255, 255, 255)

S = 512                     # design canvas
RADIUS = 112                # corner radius of the tile

# The "A", on the 512 canvas.
OUTER = [(256, 96), (416, 416), (344, 416), (256, 240), (168, 416), (96, 416)]
BAR = [(170, 300), (342, 300), (342, 360), (170, 360)]


def _scaled(points, factor, dx=0.0, dy=0.0):
    return [(x * factor + dx, y * factor + dy) for x, y in points]


def draw_mark(size: int, *, bg: bool = True, inset: float = 1.0, ss: int = 4) -> Image.Image:
    """Renders the mark at `size` px, supersampled by `ss` for clean edges."""
    big = size * ss
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if bg:
        # Vertical gradient from NAVY to NAVY_DEEP, then masked to a rounded square.
        grad = Image.new("RGBA", (big, big))
        gd = ImageDraw.Draw(grad)
        for y in range(big):
            t = y / max(big - 1, 1)
            gd.line(
                [(0, y), (big, y)],
                fill=tuple(round(a + (b - a) * t) for a, b in zip(NAVY, NAVY_DEEP)) + (255,),
            )
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, big - 1, big - 1], radius=RADIUS * big / S, fill=255
        )
        img.paste(grad, (0, 0), mask)

    # Scale the glyph into the tile, honouring the maskable safe zone via `inset`.
    f = (big / S) * inset
    off = (big - S * f) / 2
    d.polygon(_scaled(OUTER, f, off, off), fill=YELLOW + (255,))
    d.polygon(_scaled(BAR, f, off, off), fill=YELLOW + (255,))

    return img.resize((size, size), Image.LANCZOS)


def svg() -> str:
    pts = lambda p: " ".join(f"{x},{y}" for x, y in p)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" role="img" aria-label="AeroTAXI">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#{NAVY[0]:02X}{NAVY[1]:02X}{NAVY[2]:02X}"/>
      <stop offset="1" stop-color="#{NAVY_DEEP[0]:02X}{NAVY_DEEP[1]:02X}{NAVY_DEEP[2]:02X}"/>
    </linearGradient>
  </defs>
  <rect width="{S}" height="{S}" rx="{RADIUS}" fill="url(#bg)"/>
  <polygon points="{pts(OUTER)}" fill="#{YELLOW[0]:02X}{YELLOW[1]:02X}{YELLOW[2]:02X}"/>
  <polygon points="{pts(BAR)}" fill="#{YELLOW[0]:02X}{YELLOW[1]:02X}{YELLOW[2]:02X}"/>
</svg>
"""


def font(size: int, name: str = "segoeuib.ttf") -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(os.path.join(os.environ["WINDIR"], "Fonts", name), size)


def og_image() -> Image.Image:
    """1200x630 link-preview card: icon + wordmark lockup over the brand gradient."""
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), NAVY)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        d.line([(0, y), (w, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(NAVY, NAVY_DEEP)))

    # Blurred brand glow, so the flat gradient has somewhere to breathe.
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    # A light-blue bloom, not yellow: yellow at low alpha over navy reads green.
    ImageDraw.Draw(glow).ellipse([780, -220, 1360, 360], fill=(76, 169, 221, 60))
    ImageDraw.Draw(glow).ellipse([-200, 380, 300, 880], fill=(255, 255, 255, 20))
    glow = glow.filter(ImageFilter.GaussianBlur(110))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)

    # Lockup: tile + wordmark sharing a baseline.
    tile = draw_mark(132)
    img.paste(tile, (96, 150), tile)
    d.text((252, 163), "AeroTAXI", font=font(86), fill=WHITE)

    d.line([(98, 336), (1104, 336)], fill=(120, 165, 196), width=2)

    d.text((98, 376), "Reliable, on-time UK airport transfers",
           font=font(52, "segoeui.ttf"), fill=(214, 231, 243))

    chips = ["Live flight tracking", "Meet & greet", "24/7 support"]
    x = 98
    cf = font(28, "segoeui.ttf")
    for label in chips:
        tw = d.textlength(label, font=cf)
        d.rounded_rectangle([x, 470, x + tw + 44, 528], radius=29,
                            fill=(255, 255, 255, 18), outline=YELLOW, width=2)
        d.text((x + 22, 486), label, font=cf, fill=YELLOW)
        x += tw + 44 + 18

    return img


def main() -> None:
    os.makedirs(OUT, exist_ok=True)

    with open(os.path.join(OUT, "favicon.svg"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(svg())

    # Multi-resolution .ico for browsers and Windows that still ask for one.
    draw_mark(256).save(
        os.path.join(OUT, "favicon.ico"),
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    draw_mark(180).save(os.path.join(OUT, "apple-touch-icon.png"))
    draw_mark(192).save(os.path.join(OUT, "icon-192.png"))
    draw_mark(512).save(os.path.join(OUT, "icon-512.png"))
    # Maskable: same art, pulled into the 80% safe zone so Android can crop it.
    draw_mark(512, inset=0.62).save(os.path.join(OUT, "icon-512-maskable.png"))
    og_image().save(os.path.join(OUT, "og-image.png"), optimize=True)

    for name in ("favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png",
                 "icon-512.png", "icon-512-maskable.png", "og-image.png"):
        print(f"  {name:26s} {os.path.getsize(os.path.join(OUT, name)):>8,} bytes")


if __name__ == "__main__":
    main()
