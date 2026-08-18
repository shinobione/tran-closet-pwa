from pathlib import Path
import base64
import io

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BRANDING = ROOT / 'branding'
ICONS = ROOT / 'icons'
SOURCE = BRANDING / 'source-v057'

BRANDING.mkdir(parents=True, exist_ok=True)
ICONS.mkdir(parents=True, exist_ok=True)


def read_parts(pattern: str) -> Image.Image:
    parts = sorted(SOURCE.glob(pattern))
    if not parts:
        raise RuntimeError(f'Missing V0.5.7 source parts: {pattern}')
    encoded = ''.join(p.read_text(encoding='ascii').strip() for p in parts)
    raw = base64.b64decode(encoded, validate=True)
    image = Image.open(io.BytesIO(raw))
    image.load()
    print(pattern, 'parts=', len(parts), 'source=', image.size, image.mode, 'bytes=', len(raw))
    return image.convert('RGBA')


def save_png(image: Image.Image, path: Path) -> None:
    image.save(path, 'PNG', optimize=True)


def contain(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    return copy


header = read_parts('header.b64.part*')
logo = read_parts('logo.b64.part*')
favicon_master = read_parts('favicon-v2.b64.part*')
splash_master = read_parts('splash-v2.b64.part*')

# Preserve the user's transparent artwork directly for UI branding.
save_png(header, BRANDING / 'header-lockup.png')
save_png(header, BRANDING / 'logo-lockup-centered.png')
save_png(logo, BRANDING / 'logo-mark-v057.png')
save_png(logo, BRANDING / 'logo-mark.png')
save_png(contain(logo, (256, 256)), BRANDING / 'logo-mark-256.png')

# Favicon / PWA icon family from the user's square icon artwork.
for size, name in (
    (192, 'icon-192.png'),
    (512, 'icon-512.png'),
    (180, 'apple-touch-icon.png'),
):
    icon = favicon_master.resize((size, size), Image.Resampling.LANCZOS)
    save_png(icon, ICONS / name)

# Maskable icon: keep the full artwork safely inset on a dark plum canvas.
maskable = Image.new('RGBA', (512, 512), (22, 5, 31, 255))
inner = favicon_master.resize((410, 410), Image.Resampling.LANCZOS)
maskable.alpha_composite(inner, ((512 - inner.width) // 2, (512 - inner.height) // 2))
save_png(maskable, ICONS / 'maskable-512.png')

for size in (16, 32, 48):
    icon = favicon_master.resize((size, size), Image.Resampling.LANCZOS)
    icon = icon.filter(ImageFilter.UnsharpMask(radius=.45, percent=135, threshold=2))
    save_png(icon, ICONS / f'favicon-{size}.png')

favicon_master.resize((256, 256), Image.Resampling.LANCZOS).save(
    ROOT / 'favicon.ico',
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)

# iPhone 11 Pro Max startup target: preserve the complete user splash artwork,
# never crop the logo/wordmark. Fill only the extra vertical canvas with plum.
target_w, target_h = 1242, 2688
splash = Image.new('RGBA', (target_w, target_h), (14, 3, 18, 255))
art = contain(splash_master, (target_w, target_h))
splash.alpha_composite(art, ((target_w - art.width) // 2, (target_h - art.height) // 2))
save_png(splash, BRANDING / 'splash-1242x2688.png')

print('outputs:')
for path in (
    BRANDING / 'header-lockup.png',
    BRANDING / 'logo-mark-v057.png',
    BRANDING / 'splash-1242x2688.png',
    ICONS / 'icon-512.png',
    ICONS / 'maskable-512.png',
    ROOT / 'favicon.ico',
):
    print(' ', path.relative_to(ROOT), path.stat().st_size)
