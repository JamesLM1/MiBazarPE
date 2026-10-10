import bpy, math
scene=bpy.context.scene
asset=bpy.data.collections["BAZI v003 | Geometria"]
# Match the reference board exactly to the source pixel-to-unit scale.
for name,x in [("Referencia BASE",-3.9),("Referencia SALUDO",3.9)]:
    ob=bpy.data.objects[name];ob.empty_display_size=5.016;ob.location=(x,.90,2.324)
# Replace the spherical tongue with one rounded heart-shaped tongue.
old=bpy.data.objects["Lengua azul continua"];old.hide_render=True;old.hide_set(True)
outline=[(-.17,2.81),(-.145,2.849),(-.085,2.861),(0,2.835),(.085,2.861),(.145,2.849),(.17,2.81),(.151,2.766),(.085,2.725),(0,2.716),(-.085,2.725),(-.151,2.766)]
n=len(outline)
vs=[(0,-.835,2.791)]+[(x,-.832,z) for x,z in outline]+[(0,-.816,2.791)]+[(x,-.816,z) for x,z in outline]
fs=[]
for i in range(n):
    j=(i+1)%n
    fs.append((0,i+1,j+1))
    fs.append((n+1,n+2+j,n+2+i))
    fs.append((i+1,n+2+i,n+2+j,j+1))
me=bpy.data.meshes.new("Lengua corazon");me.from_pydata(vs,[],fs);me.update()
ob=bpy.data.objects.new("Lengua | sonrisa azul",me);asset.objects.link(ob);me.materials.append(bpy.data.materials["v003 | Lengua azul"])
be=ob.modifiers.new("Borde suave","BEVEL");be.width=.008;be.segments=3
for p in me.polygons:p.use_smooth=True
# Flat blue strips match the hoodie pocket instead of round rods.
for sg,side in [(-1,"R"),(1,"L")]:
    old=bpy.data.objects["Ribete bolsillo."+side];old.hide_render=True;old.hide_set(True)
    xzs=[(sg*.532,1.475),(sg*.624,1.474),(sg*.784,1.09),(sg*.739,1.063),(sg*.697,1.074)]
    me=bpy.data.meshes.new("Ribete plano."+side)
    me.from_pydata([(x,-.553,z) for x,z in xzs],[],[tuple(range(len(xzs)))]);me.update()
    ob=bpy.data.objects.new("Ribete plano bolsillo."+side,me);asset.objects.link(ob);me.materials.append(bpy.data.materials["v003 | Ribetes azul"])
    sol=ob.modifiers.new("Bordado grosor","SOLIDIFY");sol.thickness=.016
    be=ob.modifiers.new("Bordado suave","BEVEL");be.width=.018;be.segments=4
    old=bpy.data.objects["Hebilla."+side];old.hide_render=True;old.hide_set(True)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(sg*.853,-.566,1.68))
    ob=bpy.context.object
    for c in list(ob.users_collection):c.objects.unlink(ob)
    asset.objects.link(ob);ob.name="Hebilla rectangular."+side;ob.scale=(.139,.038,.062)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(bpy.data.materials["v003 | Ribetes azul"])
    be=ob.modifiers.new("Hebilla borde suave","BEVEL");be.width=.011;be.segments=4
    ob.modifiers.new("Normales hebilla","WEIGHTED_NORMAL")
# Slightly larger black pupils make the blue a thin lower crescent.
for side in ["L","R"]:
    pupil=bpy.data.objects["Pupila."+side]
    for v in pupil.data.vertices:v.co.z*=1.045
# Keep comparison boards visible and the studio helpers out of the viewport.
for screen in bpy.data.screens:
    for ar in screen.areas:
        if ar.type=="VIEW_3D":ar.spaces.active.region_3d.view_distance=8.8
bpy.ops.object.select_all(action="DESELECT")
bpy.ops.wm.save_as_mainfile(filepath=r"C:\Users\Admin\Documents\MiBazarPE\assets\bazi\04_modelo_3d\iteraciones\v003\Bazi_v003.blend")
print("Final visual refinements saved; references calibrated")

