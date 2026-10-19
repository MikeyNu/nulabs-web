"""Fit authored UI to inspected Higgsfield screen geometry. No generative editing.

Requires Pillow. Run render-screens.mjs first. Scene coordinates are measured in
the original plate pixels, ordered top-left, top-right, bottom-right, bottom-left.
The original plate and exact UI remain separate, reproducible source assets.
"""
from pathlib import Path
import json, sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]

def solve(matrix, values):
    """Small pivoted Gaussian elimination, avoiding a runtime numpy dependency."""
    rows = [list(map(float, row)) + [float(value)] for row, value in zip(matrix, values)]
    size = len(rows)
    for column in range(size):
        pivot = max(range(column, size), key=lambda i: abs(rows[i][column]))
        rows[column], rows[pivot] = rows[pivot], rows[column]
        scale = rows[column][column]
        if abs(scale) < 1e-12:
            raise ValueError('Degenerate screen quadrilateral')
        rows[column] = [value / scale for value in rows[column]]
        for i in range(size):
            if i != column:
                amount = rows[i][column]
                rows[i] = [a - amount * b for a, b in zip(rows[i], rows[column])]
    return [row[-1] for row in rows]

def inverse_homography(destination, source):
    matrix, values = [], []
    for (x, y), (u, v) in zip(destination, source):
        matrix.extend(([x,y,1,0,0,0,-u*x,-u*y], [0,0,0,x,y,1,-v*x,-v*y]))
        values.extend((u,v))
    return solve(matrix, values)

def compose(id, config):
    plate_path = ROOT / config['plate']
    screen_path = ROOT / 'private/showcase/screens' / f'{id}.png'
    plate = Image.open(plate_path).convert('RGB')
    screen = Image.open(screen_path).convert('RGB')
    assert list(plate.size) == config['plate_size'], f'{id}: plate dimensions changed'
    assert plate.width * plate.height >= 8_000_000, f'{id}: source is below the observed 4K-setting pixel budget'
    w, h = screen.size
    transform = inverse_homography(config['screen_quad'], [(0,0),(w,0),(w,h),(0,h)])
    mask = Image.new('L', screen.size, 0)
    radius = round(config.get('corner_radius', 0) * w / config['ui_width'])
    ImageDraw.Draw(mask).rounded_rectangle((0,0,w-1,h-1),radius=radius,fill=255)
    # Mild optical softness is confined to the alpha edge. Exact UI pixels and
    # colours are not rewritten, recoloured, reflected or generatively repaired.
    warped = screen.transform(plate.size, Image.Transform.PERSPECTIVE, transform, Image.Resampling.BICUBIC)
    alpha = mask.transform(plate.size, Image.Transform.PERSPECTIVE, transform, Image.Resampling.BICUBIC)
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.35))
    plate.paste(warped, (0,0), alpha)
    masters = ROOT / 'art/product-ui/masters'; masters.mkdir(parents=True,exist_ok=True)
    plate.save(masters / f'{id}-{plate.width}x{plate.height}.webp', quality=98, method=6)
    output = ROOT / 'public/assets/solutions'; output.mkdir(parents=True,exist_ok=True)
    variants=[]
    for width in (800,1600,2400):
        height=round(plate.height*width/plate.width)
        resized=plate.resize((width,height),Image.Resampling.LANCZOS)
        file=output/f'{id}-{width}.webp'
        resized.save(file,quality=92,method=6)
        variants.append({'src':f'/assets/solutions/{file.name}','width':width,'height':height,'bytes':file.stat().st_size})
    preview=ROOT/'qa-output/showcase-composites';preview.mkdir(parents=True,exist_ok=True)
    plate.resize((1800,round(plate.height*1800/plate.width)),Image.Resampling.LANCZOS).save(preview/f'{id}.jpg',quality=96)
    return {'id':id,'sourceSize':list(plate.size),'variants':variants,'master':f'art/product-ui/masters/{id}-{plate.width}x{plate.height}.webp'}

config=json.loads((ROOT/'art/product-ui/scene-geometry.json').read_text())
ids=sys.argv[1:] or list(config)
report=[compose(id,config[id]) for id in ids]
(ROOT/'qa-output/showcase-export-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
