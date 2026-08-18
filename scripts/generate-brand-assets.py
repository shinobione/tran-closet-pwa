from pathlib import Path
import base64
import hashlib
import io

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BRANDING = ROOT / 'branding'
ICONS = ROOT / 'icons'
FAVICON_PARTS = sorted((BRANDING / 'source-v058').glob('favicon.b64.part*'))

ICONS.mkdir(parents=True, exist_ok=True)

if not FAVICON_PARTS:
    raise RuntimeError('No V0.5.8 canonical favicon source parts found.')

encoded = ''.join(part.read_text(encoding='ascii').strip() for part in FAVICON_PARTS)
source_bytes = base64.b64decode(encoded, validate=True)
source_hash = hashlib.sha256(source_bytes).hexdigest()
source = Image.open(io.BytesIO(source_bytes)).convert('RGBA')


def contain_square(image, size, safe_ratio=0.96, background=None):
    canvas = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
    inner = max(1, round(size * safe_ratio))
    mark = image.copy()
    mark.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def save_png(image, path):
    image.save(path, format='PNG', optimize=True)


# Browser favicons: preserve the exact transparent/glossy master identity.
for size in (16, 32, 48):
    icon = contain_square(source, size, 0.98)
    if size <= 32:
        icon = icon.filter(ImageFilter.UnsharpMask(radius=0.35, percent=135, threshold=1))
    save_png(icon, ICONS / f'favicon-{size}.png')

# Installed app icons: a dark app-native backing avoids white/cream halos on iOS/Android.
app_bg = (23, 19, 29, 255)
save_png(contain_square(source, 192, 0.96, app_bg), ICONS / 'icon-192.png')
save_png(contain_square(source, 512, 0.96, app_bg), ICONS / 'icon-512.png')
save_png(contain_square(source, 512, 0.76, app_bg), ICONS / 'maskable-512.png')
save_png(contain_square(source, 180, 0.94, app_bg), ICONS / 'apple-touch-icon.png')

ico = contain_square(source, 256, 0.98)
ico.save(ROOT / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

print('V0.5.8 system icons generated from final favicon master', source.size, source_hash)
