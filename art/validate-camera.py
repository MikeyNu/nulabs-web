"""Validate authored camera positions against real evaluated geometry."""
import bpy,json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get()
objects=[o for o in scene.objects if o.type=="MESH"]
trees=[(o,BVHTree.FromObject(o,deps)) for o in objects]
minimum={"distance":1e9}
bounds=[]
for frame in range(1,290):
 scene.frame_set(frame);cam=scene.camera
 for obj,tree in trees:
  local=obj.matrix_world.inverted()@cam.location
  hit=tree.find_nearest(local)
  if hit and hit[0] is not None:
   world=obj.matrix_world@hit[0];distance=(world-cam.location).length
   if distance<minimum["distance"]:minimum={"distance":distance,"object":obj.name,"frame":frame}
 if frame in [1,97,193,289]:
  coords=[]
  for obj in objects:
   if not obj.name.startswith("Exact Nu Labs fin"):continue
   for vertex in obj.data.vertices:
    v=world_to_camera_view(scene,cam,obj.matrix_world@vertex.co)
    coords.append((v.x,1-v.y,v.z))
  bounds.append({"frame":frame,"left":min(x[0] for x in coords),"top":min(x[1] for x in coords),"right":max(x[0] for x in coords),"bottom":max(x[1] for x in coords),"closest_depth":min(x[2] for x in coords)})
assert minimum["distance"]>.5,minimum
for b in bounds:
 assert b["left"]>0 and b["right"]<1 and b["top"]>0 and b["bottom"]<1,b
report={"camera_samples_checked":289,"minimum_surface_clearance_metres":minimum,"sculpture_screen_bounds":bounds,"static_mesh_objects":len(objects),"ui":"Screen-space HTML, absent throughout media."}
(ROOT/"art/camera-verification.json").write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
