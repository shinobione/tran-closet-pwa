from pathlib import Path
import base64
import hashlib
import io

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BRANDING = ROOT / 'branding'
ICONS = ROOT / 'icons'
SOURCE_TEXT = BRANDING / 'favicon-user-v058.b64'
EXPECTED_SHA256 = 'b0a52f01ae3679515abc10caf1db3a331a49ab57d85928ed3a007696a1f8eb3d'

ICONS.mkdir(parents=True, exist_ok=True)

if not SOURCE_TEXT.exists():
    raise RuntimeError('Canonical glossy user favicon source is missing.')

source_bytes = base64.b64decode(SOURCE_TEXT.read_text(encoding='ascii').strip(), validate=True)
actual_hash = hashlib.sha256(source_bytes).hexdigest()
if actual_hash != EXPECTED_SHA256:
    raise RuntimeError(f'Glossy favicon checksum mismatch: {actual_hash}')

source = Image.open(io.BytesIO(source_bytes)).convert('RGBA')


def contain_square(image, size, safe_ratio=0.96, background=None):
    canvas = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
    inner = max(1, round(size * safe_ratio))
    bbox = image.getbbox()
    mark = image.crop(bbox) if bbox else image.copy()
    scale = min(inner / max(1, mark.width), inner / max(1, mark.height))
    target = (max(1, round(mark.width * scale)), max(1, round(mark.height * scale)))
    mark = mark.resize(target, Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def save_png(image, path):
    image.save(path, format='PNG', optimize=True)


# Browser favicon: exact glossy rounded-square artwork, not the old cream identity.
for size in (16, 32, 48):
    icon = contain_square(source, size, 0.98)
    if size <= 32:
        icon = icon.filter(ImageFilter.UnsharpMask(radius=0.35, percent=130, threshold=1))
    save_png(icon, ICONS / f'favicon-{size}.png')

# Standard installed icons keep the complete glossy square; maskable gets a safe-zone inset.
app_bg = (23, 19, 29, 255)
save_png(contain_square(source, 192, 0.96, app_bg), ICONS / 'icon-192.png')
save_png(contain_square(source, 512, 0.96, app_bg), ICONS / 'icon-512.png')
save_png(contain_square(source, 512, 0.78, app_bg), ICONS / 'maskable-512.png')
save_png(contain_square(source, 180, 0.94, app_bg), ICONS / 'apple-touch-icon.png')

ico = contain_square(source, 256, 0.98)
ico.save(ROOT / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

print('V0.5.8 system icons generated from exact glossy user favicon', source.size, actual_hash)
