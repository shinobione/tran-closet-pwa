from pathlib import Path
import base64
import hashlib
import io

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageStat

ROOT = Path(__file__).resolve().parents[1]
BRANDING = ROOT / 'branding'
ICONS = ROOT / 'icons'
SOURCE_PARTS = sorted(BRANDING.glob('logo-source-round.b64.part*'))
EXPECTED_SOURCE_SHA256 = 'f600cd19c5ebe2a0e93f8be2c7b3d3dc5df267f10a5d1c577a85059c744920de'

BRANDING.mkdir(parents=True, exist_ok=True)
ICONS.mkdir(parents=True, exist_ok=True)

if not SOURCE_PARTS:
    raise RuntimeError('No canonical round logo source parts found.')

encoded = ''.join(part.read_text(encoding='ascii').strip() for part in SOURCE_PARTS)
source_bytes = base64.b64decode(encoded, validate=True)
source_hash = hashlib.sha256(source_bytes).hexdigest()
if source_hash != EXPECTED_SOURCE_SHA256:
    raise RuntimeError(f'Canonical logo source checksum mismatch: {source_hash}')
source = Image.open(io.BytesIO(source_bytes)).convert('RGB')

# Source is the canonical compact crop from the selected round logo artwork.
# Keep the mark crop proportional so a future higher-resolution replacement works unchanged.
w, h = source.size
mark_crop = source.crop((
    round(w * .203),
    round(h * .021),
    round(w * .807),
    round(h * .771),
))
lockup_crop = source.copy()

sample_h = max(4, round(mark_crop.height * .055))
mark_w, mark_h = mark_crop.size
top_bg = tuple(int(v) for v in ImageStat.Stat(mark_crop.crop((0, 0, mark_w, sample_h))).mean[:3])
bottom_bg = tuple(int(v) for v in ImageStat.Stat(mark_crop.crop((0, mark_h - sample_h, mark_w, mark_h))).mean[:3])


def background_gradient(size):
    canvas = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(canvas)
    for y in range(size):
        t = y / max(1, size - 1)
        color = tuple(int(top_bg[i] * (1 - t) + bottom_bg[i] * t) for i in range(3))
        draw.line((0, y, size, y), fill=color)
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

print('Brand assets generated from', len(SOURCE_PARTS), 'canonical source part(s)', source.size, source_hash)
