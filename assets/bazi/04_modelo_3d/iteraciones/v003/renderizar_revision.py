import bpy
from mathutils import Vector
scene=bpy.context.scene
scene.cycles.samples=64
scene.render.resolution_x=900
scene.render.resolution_y=900
out=r"C:\Users\Admin\Documents\MiBazarPE\assets\bazi\04_modelo_3d\iteraciones\v003"
cam=scene.camera
for name,loc in [("frontal",(0,-10,2.27)),("tres_cuartos",(6,-10,3.4)),("lateral",(10,0,2.27))]:
    cam.location=loc
    cam.rotation_euler=(Vector((0,0,2.27))-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=out+"/"+name+".png"
    bpy.ops.render.render(write_still=True)
print("BAZI_V003_VIEWS_OK")

