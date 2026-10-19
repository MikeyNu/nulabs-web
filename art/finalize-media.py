"""Remux native Blender output, decode every frame, and publish matching posters.
Uses the workstation's existing PyAV and Pillow installations. No downloads.
"""
from pathlib import Path
import av, json, hashlib, shutil, struct
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/"art/renders"
VIDEO=ROOT/"public/assets/video/journey-v2.mp4"
IMAGE=ROOT/"public/assets/images"
MASTER=ART/"journey-v2-encoded-master.mp4"
if not VIDEO.exists():
 matches=list(VIDEO.parent.glob("journey-v2*.mp4"))
 if len(matches)!=1:raise RuntimeError(f"Expected one rendered video: {matches}")
 VIDEO=matches[0]
shutil.copy2(VIDEO,MASTER)
TEMP=ART/"journey-v2-faststart.mp4"
with av.open(str(MASTER)) as src, av.open(str(TEMP),"w",options={"movflags":"+faststart"}) as out:
 stream=src.streams.video[0]
 target=out.add_stream_from_template(stream)
 for packet in src.demux(stream):
  if packet.dts is None:continue
  packet.stream=target;out.mux(packet)
VIDEO=ROOT/"public/assets/video/journey-v2.mp4"
shutil.copy2(TEMP,VIDEO)
wanted={0:"arrival",96:"clarity",192:"craft",288:"possibility"}
sampled=set(range(0,289,12))|set(wanted)
frames=[];keyframes=[];derivatives=[]
with av.open(str(VIDEO)) as source:
 stream=source.streams.video[0]
 assert len(source.streams.audio)==0
 assert stream.width==1920 and stream.height==1080
 assert str(stream.average_rate)=="24"
 assert stream.codec_context.name=="h264"
 for index,frame in enumerate(source.decode(stream)):
  if frame.key_frame:keyframes.append(index)
  if index in sampled:
   im=frame.to_image().convert("RGB");frames.append((index,im.resize((480,270),Image.Resampling.LANCZOS)))
  if index in wanted:
   im=frame.to_image().convert("RGB")
   for width in (1920,960):
    name=f"journey-v2-{wanted[index]}"+("" if width==1920 else "-960")+".webp"
    p=IMAGE/name
    output=im if width==1920 else im.resize((960,540),Image.Resampling.LANCZOS)
    output.save(p,"WEBP",quality=90,method=6)
    derivatives.append({"path":str(p.relative_to(ROOT)).replace("\\","/"),"width":width,"height":int(width*9/16),"bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()})
  count=index+1
 pixel_format=stream.codec_context.format.name
 duration=float(stream.duration*stream.time_base)
assert count==289,count
assert pixel_format=="yuv420p",pixel_format
assert max(b-a for a,b in zip(keyframes,keyframes[1:]))<=6,keyframes
# Faststart is verified from actual top-level MP4 atom order.
data=VIDEO.read_bytes();boxes=[];p=0
while p+8<=len(data):
 size,kind=struct.unpack(">I4s",data[p:p+8]);header=8
 if size==1:size=struct.unpack(">Q",data[p+8:p+16])[0];header=16
 if size==0:size=len(data)-p
 assert size>=header
 boxes.append({"type":kind.decode("ascii"),"offset":p,"size":size});p+=size
names=[b["type"] for b in boxes]
assert names.index("moov")<names.index("mdat"),names
cols=4;rows=(len(frames)+cols-1)//cols
sheet=Image.new("RGB",(cols*480,rows*294),(240,240,237));draw=ImageDraw.Draw(sheet)
for idx,(f,im) in enumerate(frames):
 x=(idx%cols)*480;y=(idx//cols)*294
 sheet.paste(im,(x,y));draw.text((x+10,y+276),f"Frame {f:03d} | {f/24:.2f}s",fill=(20,20,20))
sheet.save(ART/"final-decoded-contact-sheet.jpg",quality=92)
hold=Image.new("RGB",(960,588),(240,240,237));draw=ImageDraw.Draw(hold)
for i,frame in enumerate(wanted):
 im=next(im for f,im in frames if f==frame);x=(i%2)*480;y=(i//2)*294
 hold.paste(im,(x,y));draw.text((x+10,y+276),f"{wanted[frame]} | {frame/24:.1f}s",fill=(20,20,20))
hold.save(ART/"final-landing-study.jpg",quality=94)
report={"video":"public/assets/video/journey-v2.mp4","codec":"h264","pixel_format":pixel_format,"width":1920,"height":1080,"fps":24,"frames_decoded":count,"duration":duration,"last_frame_time":12,"bytes":VIDEO.stat().st_size,"sha256":hashlib.sha256(data).hexdigest(),"keyframes":keyframes,"maximum_gop":max(b-a for a,b in zip(keyframes,keyframes[1:])),"audio_streams":0,"atoms":boxes,"posters":derivatives,"provenance":"Deterministic locally rendered Blender scene from owner-supplied logo. No generated text, no AI generation credits."}
(ROOT/"art/media-verification.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k not in ["keyframes","atoms","posters"]},indent=2))
