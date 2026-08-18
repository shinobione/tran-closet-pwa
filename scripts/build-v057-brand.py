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
    raw = base64.b64decode(encoded, validate=True)
    image = Image.open(io.BytesIO(raw))
    image.load()
    return image.convert('RGBA')


def save_png(image, path):
    image.save(path, 'PNG', optimize=True)


def contain(image, size, background=(17, 3, 20, 255)):
    canvas = Image.new('RGBA', size, background)
    fitted = ImageOps.contain(image, size, Image.Resampling.LANCZOS)
    canvas.alpha_composite(fitted, ((size[0]-fitted.width)//2, (size[1]-fitted.height)//2))
    return canvas

header = decode_parts('header.b64.part*')
logo = decode_parts('logo.b64.part*')
favicon = decode_parts('favicon-v2.b64.part*')
splash = decode_parts('splash-v2.b64.part*')

# Hard guards against the old cream branding accidentally returning.
if header.width / header.height < 2.2:
    raise RuntimeError(f'Header lockup aspect looks wrong: {header.size}')
if logo.width / logo.height < 0.85 or logo.width / logo.height > 1.15:
    raise RuntimeError(f'Logo mark aspect looks wrong: {logo.size}')
if header.getchannel('A').getextrema()[0] != 0 or logo.getchannel('A').getextrema()[0] != 0:
    raise RuntimeError('Header/logo sources are not transparent.')

save_png(header, BRANDING / 'header-lockup-v057.png')
save_png(logo, BRANDING / 'logo-mark-v057.png')

# iPhone 11 Pro Max startup target used by the existing PWA link.
if splash.size != (1242, 2688):
    splash = contain(splash, (1242, 2688))
save_png(splash, BRANDING / 'splash-1242x2688.png')

for size, name in [
    (16, 'favicon-16.png'),
    (32, 'favicon-32.png'),
    (48, 'favicon-48.png'),
    (180, 'apple-touch-icon.png'),
    (192, 'icon-192.png'),
    (512, 'icon-512.png'),
]:
    icon = ImageOps.contain(favicon, (size, size), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0,0,0,0))
    canvas.alpha_composite(icon, ((size-icon.width)//2, (size-icon.height)//2))
    save_png(canvas, ICONS / name)

# Maskable icon: preserve safe-zone around the supplied square app artwork.
maskable = Image.new('RGBA', (512,512), (20,4,25,255))
safe = ImageOps.contain(favicon, (410,410), Image.Resampling.LANCZOS)
maskable.alpha_composite(safe, ((512-safe.width)//2, (512-safe.height)//2))
save_png(maskable, ICONS / 'maskable-512.png')

favicon_ico = ImageOps.contain(favicon, (256,256), Image.Resampling.LANCZOS)
favicon_ico.save(ROOT / 'favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])

print('V0.5.7 sources decoded:', 'header', header.size, 'logo', logo.size, 'favicon', favicon.size, 'splash', splash.size)
