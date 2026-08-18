from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BRANDING = ROOT / 'branding'
ICONS = ROOT / 'icons'
SOURCE = BRANDING / 'logo-mark-v057.png'

ICONS.mkdir(parents=True, exist_ok=True)

if not SOURCE.exists():
    raise RuntimeError('Verified Trân Closet logo mark is missing.')

source = Image.open(SOURCE).convert('RGBA')


def contain_square(image, size, safe_ratio=0.96, background=None):
    canvas = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
    inner = max(1, round(size * safe_ratio))
    mark = image.copy()
    mark.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def save_png(image, path):
    image.save(path, format='PNG', optimize=True)


# Browser favicon uses the same visible magenta/violet mark as the app itself.
for size in (16, 32, 48):
    icon = contain_square(source, size, 0.94)
    if size <= 32:
        icon = icon.filter(ImageFilter.UnsharpMask(radius=0.35, percent=135, threshold=1))
    save_png(icon, ICONS / f'favicon-{size}.png')

# Installed PWA icons receive the existing app-dark background, never the old cream tile.
app_bg = (23, 19, 29, 255)
save_png(contain_square(source, 192, 0.88, app_bg), ICONS / 'icon-192.png')
save_png(contain_square(source, 512, 0.88, app_bg), ICONS / 'icon-512.png')
save_png(contain_square(source, 512, 0.72, app_bg), ICONS / 'maskable-512.png')
save_png(contain_square(source, 180, 0.86, app_bg), ICONS / 'apple-touch-icon.png')

ico = contain_square(source, 256, 0.94)
ico.save(ROOT / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

print('V0.5.8 system icons generated from verified visible logo mark', source.size)
