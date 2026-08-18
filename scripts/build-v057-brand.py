from pathlib import Path
import base64, io
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'branding' / 'source-v057'
BRANDING = ROOT / 'branding'
ICONS = ROOT / 'icons'
ICONS.mkdir(exist_ok=True)


def decode_parts(pattern):
    parts = sorted(SRC.glob(pattern))
    if not parts:
        raise RuntimeError(f'Missing source parts: {pattern}')
    encoded = ''.join(p.read_text(encoding='ascii').strip() for p in parts)
    encoded += '=' * (-len(encoded) % 4)
    raw = base64.b64decode(encoded, validate=True)
    image = Image.open(io.BytesIO(raw))
    image.load()
    return image.convert('RGBA')


def save_png(image, path):
    image.save(path, 'PNG', optimize=True)


def fit_icon(image, size, safe=None, background=(0, 0, 0, 0)):
    canvas = Image.new('RGBA', (size, size), background)
    target = safe or size
    fitted = ImageOps.contain(image, (target, target), Image.Resampling.LANCZOS)
    canvas.alpha_composite(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    return canvas


# Compact, visually faithful derivatives of the four user-approved masters.
header = decode_parts('header-v3.b64.part*')
logo = decode_parts('logo-v3.b64.part*')
icon = decode_parts('icon-v3.b64.part*')
splash = decode_parts('splash-v3.b64.part*')

# Hard guards: never silently fall back to the old cream badge branding.
if header.width / header.height < 2.2:
    raise RuntimeError(f'Header lockup aspect looks wrong: {header.size}')
if not (0.85 < logo.width / logo.height < 1.15):
    raise RuntimeError(f'Logo mark aspect looks wrong: {logo.size}')
if header.getchannel('A').getextrema()[0] != 0:
    raise RuntimeError('Header source is not transparent.')
if logo.getchannel('A').getextrema()[0] != 0:
    raise RuntimeError('Logo source is not transparent.')

save_png(header, BRANDING / 'header-lockup-v057.png')
save_png(logo, BRANDING / 'logo-mark-v057.png')

# Existing iPhone 11 Pro Max startup-image target.
splash = splash.convert('RGB').resize((1242, 2688), Image.Resampling.LANCZOS)
splash.save(BRANDING / 'splash-1242x2688.png', 'PNG', optimize=True)

for size, name in [
    (16, 'favicon-16.png'),
    (32, 'favicon-32.png'),
    (48, 'favicon-48.png'),
    (180, 'apple-touch-icon.png'),
    (192, 'icon-192.png'),
    (512, 'icon-512.png'),
]:
    save_png(fit_icon(icon, size), ICONS / name)

# Keep the supplied square artwork inside the PWA maskable safe zone.
save_png(fit_icon(icon, 512, safe=410, background=(20, 4, 25, 255)), ICONS / 'maskable-512.png')
fit_icon(icon, 256).save(ROOT / 'favicon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64)])

print('V0.5.7 exact-brand sources decoded:',
      'header', header.size,
      'logo', logo.size,
      'icon', icon.size,
      'splash', splash.size)
