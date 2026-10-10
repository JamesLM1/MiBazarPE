import bpy
from pathlib import Path
from mathutils import Vector
out=Path(__file__).parent
s=bpy.context.scene
s.render.resolution_x=850;s.render.resolution_y=850;s.cycles.samples=48
cam=s.camera
for name,loc in [("frontal",(0,-10,2.27)),("tres_cuartos",(6,-10,3.1))]:
    cam.location=loc;cam.rotation_euler=(Vector((0,0,2.27))-cam.location).to_track_quat("-Z","Y").to_euler()
    s.render.filepath=str(out/(name+".png"))
    bpy.ops.render.render(write_still=True)
print("V4_PREVIEW_DONE")

