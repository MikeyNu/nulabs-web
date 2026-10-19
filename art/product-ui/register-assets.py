"""Register the exported website variants and record source measurements."""
from pathlib import Path
import hashlib, json
from PIL import Image

root=Path(__file__).resolve().parents[2]
manifest_path=root/'public/assets/manifest.json'
manifest=json.loads(manifest_path.read_text())
devices={'erp':'a graphite laptop','crm':'a desktop monitor','pos':'a point-of-sale terminal beside a receipt printer','mobile':'an upright smartphone','ai':'a silver laptop','cyber':'a desktop monitor on a charcoal desk'}
records=[]
for id,device in devices.items():
    variants=[]
    for width in (800,1600,2400):
        file=root/f'public/assets/solutions/{id}-{width}.webp'
        with Image.open(file) as im:w,h=im.size
        variants.append(dict(src=f'/assets/solutions/{file.name}',width=w,height=h,bytes=file.stat().st_size))
    manifest['images'][f'solution-{id}']={
        'src':variants[1]['src'],'width':1600,'height':1067,'variants':variants,
        'alt':f'Illustrative {id.upper()} interface with demo data on {device}.',
        'status':'reviewed website-specific concept',
        'provenance':'Higgsfield GPT Image 2.5 Sunburst photographic plate with exact authored SVG interface; illustrative concept, not a live product screenshot',
        'sourceDimensions':[3504,2336]
    }
    plate=root/f'art/product-ui/plates/{id}.png'
    master=root/f'art/product-ui/masters/{id}-3504x2336.webp'
    records.append({'id':id,'plate':str(plate.relative_to(root)).replace('\\','/'),'plate_sha256':hashlib.sha256(plate.read_bytes()).hexdigest(),
                    'master':str(master.relative_to(root)).replace('\\','/'),'master_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),
                    'native_dimensions':[3504,2336],'variants':variants})
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
production={'date':'2026-10-19','provider':'Higgsfield','model':'gpt_image_2_5','variant':'sunburst','quality':'max','requested_resolution':'4k','aspect_ratio':'3:2',
            'delivered_resolution_note':'All six original provider PNG files are 3504 x 2336 pixels. No resampling is used to claim a 3840- or 4096-pixel native source.',
            'generation_count':6,'repair_generations':0,'ui':'Exact authored SVG, rendered at 3x in Edge and fitted to the inspected screen quadrilateral',
            'records':records}
(root/'art/product-ui/production.json').write_text(json.dumps(production,indent=2)+'\n',encoding='utf-8')
print('Registered six photographic assets, 18 web variants, original source hashes and native-size master hashes.')
