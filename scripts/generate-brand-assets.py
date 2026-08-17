from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'branding' / 'logo-source-round.jpg'
BRANDING = ROOT / 'branding'
ICONS = ROOT / 'icons'

BRANDING.mkdir(parents=True, exist_ok=True)
ICONS.mkdir(parents=True, exist_ok=True)

source = Image.open(SOURCE).convert('RGB')
# Source is the canonical crop from the selected round logo artwork.
# The upper portion contains the circular hanger/aperture/wardrobe mark.
mark_crop = source.crop((205, 15, 815, 555))
lockup_crop = source.copy()

arr = np.array(mark_crop)
top_bg = tuple(int(x) for x in arr[:30].mean(axis=(0, 1)))
bottom_bg = tuple(int(x) for x in arr[-30:].mean(axis=(0, 1)))


def background_gradient(size):
    canvas = Image.new('RGB', (size, size))
    pixels = canvas.load()
    for y in range(size):
        t = y / max(1, size - 1)
        color = tuple(int(top_bg[i] * (1 - t) + bottom_bg[i] * t) for i in range(3))
        for x in range(size):
            pixels[x, y] = color
    return canvas


def square_mark(size=768, inner_ratio=.90, maskable=False):
    canvas = background_gradient(size)
    inner = int(size * (.68 if maskable else inner_ratio))
    mark = ImageEnhance.Contrast(mark_crop.copy()).enhance(1.02)
    mark.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    canvas.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def quantized_save(image, path, colors=128):
    image.convert('RGB').quantize(colors=colors, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)


quantized_save(lockup_crop, BRANDING / 'logo-lockup-centered.png')
quantized_save(square_mark(768, .90), BRANDING / 'logo-mark.png')
quantized_save(square_mark(256, .92), BRANDING / 'logo-mark-256.png')
quantized_save(square_mark(192, .92), ICONS / 'icon-192.png')
quantized_save(square_mark(512, .92), ICONS / 'icon-512.png')
quantized_save(square_mark(512, .92, maskable=True), ICONS / 'maskable-512.png')
quantized_save(square_mark(180, .92), ICONS / 'apple-touch-icon.png')

for size in (16, 32, 48):
    favicon = square_mark(128, .98).resize((size, size), Image.Resampling.LANCZOS)
    favicon = favicon.filter(ImageFilter.UnsharpMask(radius=.5, percent=150, threshold=2))
    quantized_save(favicon, ICONS / f'favicon-{size}.png', colors=64)

square_mark(256, .98).save(
    ROOT / 'favicon.ico',
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
)

# iPhone 414x896 @3x startup image. Other devices safely ignore the media-targeted link.
width, height = 1242, 2688
splash = Image.new('RGBA', (width, height), (16, 13, 20, 255))
tile_size = 720
tile = square_mark(tile_size, .86).convert('RGBA')
mask = Image.new('L', (tile_size, tile_size), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle((0, 0, tile_size - 1, tile_size - 1), radius=150, fill=255)
tile.putalpha(mask)
splash.alpha_composite(tile, ((width - tile_size) // 2, 690))

try:
    title_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 58)
    sub_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 28)
except OSError:
    title_font = ImageFont.load_default()
    sub_font = ImageFont.load_default()

draw = ImageDraw.Draw(splash)
for text, font, y, fill in (
    ('TỦ ĐỒ CỦA TRÂN', title_font, 1470, (255, 245, 250, 245)),
    ('SMART FASHION WARDROBE', sub_font, 1560, (184, 174, 189, 220)),
):
    box = draw.textbbox((0, 0), text, font=font)
    draw.text(((width - (box[2] - box[0])) // 2, y), text, font=font, fill=fill)

quantized_save(splash, BRANDING / 'splash-1242x2688.png')

print('Brand assets generated from', SOURCE.relative_to(ROOT))
