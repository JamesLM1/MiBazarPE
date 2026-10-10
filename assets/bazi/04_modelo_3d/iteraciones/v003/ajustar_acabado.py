import bpy, math
from mathutils import Vector
s=bpy.context.scene
# Remove white fur from the blue recessed inner-ear patches.
removed=0
for side,sg in [("L",1),("R",-1)]:
    cu=bpy.data.objects["Pelaje corto | Oreja cuenco."+side].data
    for sp in list(cu.splines):
        p=sp.points[0].co
        r=((p.x-sg*1.035)**2+((p.z-3.965)/1.025)**2)**.5
        if r<.325 and p.y<.22:cu.splines.remove(sp);removed+=1
# Set neck back into the hoodie so it is a throat, not a white ball.
neck=bpy.data.objects["Cuello pelaje | union capucha"];neck.location.y=-.06;neck.scale=(.43,.21,.21)
blue=bpy.data.materials["v003 | Azul interior orejas"]
bs=next(n for n in blue.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
bs.inputs["Base Color"].default_value=(.001,.055,.75,1)
bs.inputs["Specular IOR Level"].default_value=.11;bs.inputs["Roughness"].default_value=.6
s.view_settings.exposure=-.55
# Toe grooves in actual geometry, keeping a continuous skin surface.
skin=bpy.data.objects["Cuerpo pelaje | piernas y patas continuas"]
for v in skin.data.vertices:
    p=skin.matrix_world@v.co
    if p.z<.34 and p.y<-.27:
        shift=0
        for sg in [-1,1]:
            for xg in [sg*.54-.0925,sg*.54+.0925]:
                shift+=.044*math.exp(-((p.x-xg)/.022)**2)*math.exp(-((p.z-.15)/.105)**2)
        p.y+=shift
        v.co=skin.matrix_world.inverted()@p
# Preserve explicit status so this study cannot be mistaken for a rigged delivery.
s["estado"]="Bazi v003: estudio de parecido, pendiente de revision visual por James. Sin rig ni animaciones."
bpy.ops.wm.save_as_mainfile(filepath=r"C:\Users\Admin\Documents\MiBazarPE\assets\bazi\04_modelo_3d\iteraciones\v003\Bazi_v003.blend")
print("Inner ear fibres removed",removed,"saved v003")

