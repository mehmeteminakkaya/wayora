from pathlib import Path
from PIL import Image

assets = Path('docs/assets')
assets.mkdir(parents=True, exist_ok=True)

landing = Image.open('docs/preview-rotasyon.png')
landing.crop((0, 0, 1200, 1000)).save(assets / 'landing-hero.png')
landing.save(assets / 'landing-full.png')

Image.open('docs/preview-rotasyon-se.png').save(assets / 'mobile-home.png')
Image.open('docs/preview-rotasyon-mobile.png').save(assets / 'mobile-full.png')

trip = Image.open(assets / 'trip-detail.png')
trip.crop((0, 0, trip.width, 1250)).save(assets / 'trip-detail-crop.png')

for path in sorted(assets.glob('*.png')):
    print(path.name, Image.open(path).size)
