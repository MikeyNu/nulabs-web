"""Derive responsive transparent WebP files from the inspected Higgsfield master.

Pillow is an explicit authoring dependency only. No network or image retouching.
"""
from pathlib import Path
from PIL import Image
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / 'art/about/computer-master.png'
image = Image.open(source)
if image.mode != 'RGBA':
    raise ValueError('Master must have an alpha channel.')
alpha = image.getchannel('A')
if alpha.getextrema()[0] != 0 or alpha.getextrema()[1] < 250:
    raise ValueError('Inspect transparency and solid object coverage before export.')
output = ROOT / 'public/assets/about'
output.mkdir(parents=True, exist_ok=True)
variants = []
records = []
for width in (800, 1400, 2200):
    height = round(image.height * width / image.width)
    destination = output / f'computer-{width}.webp'
    resized = image.resize((width, height), Image.Resampling.LANCZOS)
    resized.save(destination, format='WEBP', quality=92, method=6, exact=True)
    with Image.open(destination) as delivered:
        assert delivered.mode == 'RGBA' and delivered.size == (width, height)
        assert delivered.getchannel('A').getextrema()[0] == 0
    variants.append({'src': f'/assets/about/computer-{width}.webp', 'width': width, 'height': height})
    records.append({'file': destination.relative_to(ROOT).as_posix(), 'width': width, 'height': height,
                    'bytes': destination.stat().st_size, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'alpha': True})
manifest_path = ROOT / 'public/assets/manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['images']['about-computer'] = {
    'src': '/assets/about/computer-1400.webp', 'width': 1400, 'height': round(1400 * image.height / image.width),
    'alt': 'A floating white vintage computer and keyboard', 'variants': variants,
    'provenance': 'Original Higgsfield GPT Image 2.5 Sunburst artwork, generated for the About page. Not a photograph of company equipment.'}
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
record = {'generator': 'Higgsfield GPT Image 2.5 Sunburst', 'requested': {'resolution': '4k', 'quality': 'max', 'background': 'transparent'},
          'master': {'file': 'art/about/computer-master.png', 'width': image.width, 'height': image.height,
                     'mode': image.mode, 'bytes': source.stat().st_size, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()},
          'alpha': {'extrema': alpha.getextrema(), 'note': 'Native soft alpha retained. Core object alpha is 251–254; no background replacement or artificial upscaling.'},
          'exports': records, 'quoted_credits': 15, 'attempts': 1, 'actual_charge': 'Not separately exposed by the generation response; 15 credits remain reserved in the private ledger.'}
(ROOT / 'art/about/production.json').write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps(record, indent=2))
