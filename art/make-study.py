from PIL import Image,ImageDraw
from pathlib import Path
p=Path(__file__).parent/"renders"
frames=[1,97,193,289,49,145,241]
sheet=Image.new("RGB",(1536,4*460),(242,242,238))
d=ImageDraw.Draw(sheet)
for i,f in enumerate(frames):
 im=Image.open(p/f"study-{f:04d}.png").convert("RGB")
 x=(i%2)*768;y=(i//2)*460
 sheet.paste(im,(x,y));d.text((x+15,y+438),f"FRAME {f:03d}  |  {(f-1)/24:.1f}s",fill=(20,20,20))
sheet.save(p/"camera-study.jpg",quality=92)
print(p/"camera-study.jpg")