"""Deterministic four-shot Nu Labs gallery. Blender 5.1, native EEVEE.
blender --background --factory-startup --python art/construction.py -- --preview
Use --render after inspecting art/renders/study-*.png.
Exact logo outlines are sampled from the supplied SVG, never redrawn.
"""
import bpy, math, re, json, sys
from pathlib import Path
from mathutils import Vector
from mathutils.geometry import tessellate_polygon
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"art/renders";OUT.mkdir(parents=True,exist_ok=True)
ARGS=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
PREVIEW="--preview" in ARGS
bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get("Principled BSDF")
 p.inputs["Base Color"].default_value=(*color,1);p.inputs["Roughness"].default_value=rough;p.inputs["Metallic"].default_value=metal
 return m
floor=mat("Honed mineral floor",(.69,.685,.67),.7)
wall=mat("Chalk architectural plaster",(.86,.85,.82),.8)
graphite=mat("Satin graphite sculpture",(.008,.009,.01),.36,.08)
rim=mat("Black anodised reveal",(.055,.057,.059),.36,.5)
n=graphite.node_tree.nodes.new("ShaderNodeTexNoise");n.inputs["Scale"].default_value=190
b=graphite.node_tree.nodes.new("ShaderNodeBump");b.inputs["Strength"].default_value=.08;b.inputs["Distance"].default_value=.003
graphite.node_tree.links.new(n.outputs["Fac"],b.inputs["Height"]);graphite.node_tree.links.new(b.outputs["Normal"],graphite.node_tree.nodes.get("Principled BSDF").inputs["Normal"])
def box(name,loc,size,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:
  m=o.modifiers.new("Construction bevel","BEVEL");m.width=bevel;m.segments=3;o.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
 return o
box("Continuous gallery floor",(0,0,-.16),(70,70,.3),floor,.035)
box("Distant rear wall",(0,24,8),(56,.45,16),wall,.1)
box("Distant side wall",(-26,0,8),(.45,48,16),wall,.1)
for x in [-18,-12,-6,0,6,12,18]:box("Recessed pilaster",(x,23.65,5),(.075,.2,10),floor,.015)
for y in [14,20]:box("Overhead beam",(0,y,11.5),(48,.24,.32),wall,.04)
verts=[];faces=[];steps=192
for i in range(steps):
 a=i*math.tau/steps
 for r in (6.291,6.309):verts.append((r*math.cos(a),r*math.sin(a),.002))
for i in range(steps):
 j=(i+1)%steps;faces.append((2*i,2*i+1,2*j+1,2*j))
mesh=bpy.data.meshes.new("Floor reveal");mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new("Fine circular floor joint",mesh);bpy.context.collection.objects.link(o);o.data.materials.append(rim)
svg=(ROOT/"public/assets/logo-symbol.svg").read_text(encoding="utf-8")
path=re.search(r'<path[^>]* d="([^"]+)"',svg).group(1)
tokens=re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?",path);contours=[];pts=[];i=0;current=(0,0)
while i<len(tokens):
 cmd=tokens[i];i+=1
 if cmd=="M":
  if pts:contours.append(pts)
  current=(float(tokens[i]),float(tokens[i+1]));i+=2;pts=[current]
 elif cmd=="L":
  current=(float(tokens[i]),float(tokens[i+1]));i+=2;pts.append(current)
 elif cmd=="C":
  p0=current;p1=(float(tokens[i]),float(tokens[i+1]));p2=(float(tokens[i+2]),float(tokens[i+3]));p3=(float(tokens[i+4]),float(tokens[i+5]));i+=6
  for k in range(1,13):
   t=k/12;u=1-t;pts.append(tuple(u**3*p0[a]+3*u*u*t*p1[a]+3*u*t*t*p2[a]+t**3*p3[a] for a in (0,1)))
  current=p3
 elif cmd=="Z":contours.append(pts);pts=[]
 else:raise ValueError(cmd)
if pts:contours.append(pts)
symbol=[]
for idx,profile in enumerate(contours):
 points=[((x-628)/100,(795-y)/100+.025) for x,y in profile]
 if (Vector(points[0])-Vector(points[-1])).length<.0001:points.pop()
 n=len(points);verts=[(x,-.34,z) for x,z in points]+[(x,.34,z) for x,z in points]
 vectors=[Vector((x,0,z)) for x,z in points];lookup={tuple(v):j for j,v in enumerate(vectors)};faces=[]
 for tri in tessellate_polygon([vectors]):
  ids=tuple(v if isinstance(v,int) else lookup[tuple(v)] for v in tri);faces.append(ids);faces.append(tuple(j+n for j in reversed(ids)))
 for j in range(n):k=(j+1)%n;faces.append((j,k,k+n,j+n))
 mesh=bpy.data.meshes.new(f"SVG profile {idx+1}");mesh.from_pydata(verts,[],faces);mesh.update()
 o=bpy.data.objects.new(f"Exact Nu Labs fin {idx+1}",mesh);bpy.context.collection.objects.link(o);o.data.materials.append(graphite)
 bpy.ops.object.select_all(action="DESELECT");bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.mode_set(mode="EDIT");bpy.ops.mesh.select_all(action="SELECT");bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode="OBJECT");o.select_set(False)
 m=o.modifiers.new("Hand finished edge","BEVEL");m.width=.045;m.segments=4
 m=o.modifiers.new("Weighted silhouette normals","WEIGHTED_NORMAL");m.keep_sharp=True;symbol.append(o)
def area(name,loc,target,power,size,sy,color=(1,1,1)):
 d=bpy.data.lights.new(name,"AREA");d.energy=power;d.shape="RECTANGLE";d.size=size;d.size_y=sy;d.color=color
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
area("Northlight key",(-8,-6,12),(0,0,0),5200,6,5,(1,.98,.94))
area("Overhead softbox",(5,2,10),(0,0,1),3200,7,3,(.95,.98,1))
area("Grazing reflection",(1,8,7),(0,0,2),3800,6,4)
area("Front bounce",(6,-12,5),(0,0,2),900,9,9)
world=bpy.data.worlds.new("Neutral daylight");world.use_nodes=True;world.node_tree.nodes["Background"].inputs[0].default_value=(.75,.79,.83,1);world.node_tree.nodes["Background"].inputs[1].default_value=.28;bpy.context.scene.world=world
bpy.ops.object.camera_add();cam=bpy.context.object;cam.name="Four chapter camera";cam.data.lens=39;cam.data.sensor_width=36;cam.data.clip_start=.1;cam.data.clip_end=150
scene=bpy.context.scene;scene.camera=cam
poses=[
 {"id":"arrival","frame":1,"position":[0,-18.5,6.8],"target":[0,0,2.25],"lens":39,"safe_rect":[.04,.16,.25,.42],"secondary_safe_rect":[.59,.74,.36,.2]},
 {"id":"clarity","frame":97,"position":[-13,-5.2,4.6],"target":[-1.6,4,2.5],"lens":35,"safe_rect":[.04,.22,.42,.55]},
 {"id":"craft","frame":193,"position":[10,-10,13],"target":[2.5,2.5,2],"lens":38,"safe_rect":[.57,.2,.38,.58]},
 {"id":"possibility","frame":289,"position":[7.5,12.5,5.3],"target":[-3.2,0,2],"lens":38,"safe_rect":[.52,.2,.43,.56]}]
routes=[
 [[0,-18.5,6.8],[-10,-15,6.5],[-14,-10,4.8],[-13,-5.2,4.6]],
 [[-13,-5.2,4.6],[-9,-13,9],[3,-16,15],[10,-10,13]],
 [[10,-10,13],[12,0,10],[3.5,10,7],[7.5,12.5,5.3]]]
def bezier(p,t):
 u=1-t;return Vector(p[0])*u**3+Vector(p[1])*3*u*u*t+Vector(p[2])*3*u*t*t+Vector(p[3])*t**3
def smooth(t):return t**3*(t*(t*6-15)+10)
samples=[]
for f in range(1,290):
 seg=min(2,(f-1)//96);t=smooth(((f-1)-seg*96)/96);pos=bezier(routes[seg],t);target=Vector(poses[seg]["target"]).lerp(Vector(poses[seg+1]["target"]),t)
 cam.location=pos;cam.rotation_euler=(target-pos).to_track_quat("-Z","Y").to_euler();cam.data.lens=poses[seg]["lens"]+(poses[seg+1]["lens"]-poses[seg]["lens"])*t
 cam.keyframe_insert(data_path="location",frame=f);cam.keyframe_insert(data_path="rotation_euler",frame=f);cam.data.keyframe_insert(data_path="lens",frame=f);samples.append({"frame":f,"position":list(pos),"target":list(target)})
scene.render.engine="BLENDER_EEVEE";scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=40 if PREVIEW else 100
scene.render.fps=24;scene.frame_start=1;scene.frame_end=289;scene.render.film_transparent=False;scene.render.use_motion_blur=False
scene.render.image_settings.file_format="PNG";scene.render.image_settings.color_mode="RGB";scene.render.image_settings.color_depth="8"
scene.view_settings.view_transform="AgX";scene.view_settings.look="AgX - Medium High Contrast";scene.view_settings.exposure=.5
if hasattr(scene.eevee,"taa_render_samples"):scene.eevee.taa_render_samples=32 if PREVIEW else 64
manifest={"version":2,"renderer":"Blender 5.1.2 EEVEE","source_symbol":"public/assets/logo-symbol.svg","frames":289,"fps":24,"duration":289/24,"last_frame_time":12,"chapters":poses,"camera_samples":samples,"ui":"Flat HTML only. No words or UI baked into render."}
(ROOT/"art/camera-manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
bpy.context.preferences.filepaths.save_version=0
scene.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/"art/nu-labs-journey-v2.blend"))
if PREVIEW:
 for f in [1,49,97,145,193,241,289]:
  scene.frame_set(f);scene.render.filepath=str(OUT/f"study-{f:04d}.png");bpy.ops.render.render(write_still=True)
 print("NU_CAMERA_STUDY_COMPLETE",flush=True)
elif "--render" in ARGS:
 scene.render.image_settings.media_type="VIDEO";scene.render.image_settings.file_format="FFMPEG";scene.render.ffmpeg.format="MPEG4";scene.render.ffmpeg.codec="H264";scene.render.ffmpeg.constant_rate_factor="HIGH";scene.render.ffmpeg.ffmpeg_preset="GOOD";scene.render.ffmpeg.gopsize=6;scene.render.ffmpeg.audio_codec="NONE"
 if hasattr(scene.render.ffmpeg,"use_max_b_frames"):scene.render.ffmpeg.use_max_b_frames=True;scene.render.ffmpeg.max_b_frames=0
 scene.render.filepath=str(ROOT/"public/assets/video/journey-v2.mp4");bpy.ops.render.render(animation=True)
 scene.render.image_settings.media_type="IMAGE";scene.render.image_settings.file_format="PNG"
 for idx,f in enumerate([1,97,193,289],1):
  scene.frame_set(f);scene.render.filepath=str(OUT/f"chapter-{idx}-master.png");bpy.ops.render.render(write_still=True)
 print("NU_FULL_RENDER_COMPLETE",flush=True)
