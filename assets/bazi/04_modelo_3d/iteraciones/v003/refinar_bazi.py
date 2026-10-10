import bpy, math, random, bisect, bmesh
from mathutils import Vector
scene=bpy.context.scene
asset=bpy.data.collections["BAZI v003 | Geometria"]
fur=bpy.data.materials["v003 | Pelaje marfil"]
# Round the connected hands/feet/tufts through voxel union in this new iteration only.
def union(names,newname,voxel):
    obs=[bpy.data.objects[n] for n in names]
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:o.select_set(True)
    bpy.context.view_layer.objects.active=obs[0]
    for o in obs:
        bpy.context.view_layer.objects.active=o
        for mo in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=mo.name)
    bpy.context.view_layer.objects.active=obs[0]
    bpy.ops.object.join()
    o=bpy.context.object;o.name=newname
    mo=o.modifiers.new("Union continua","REMESH");mo.mode="VOXEL";mo.voxel_size=voxel;mo.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mo.name)
    mo=o.modifiers.new("Suavizado union","SMOOTH");mo.factor=1.15;mo.iterations=4
    bpy.ops.object.modifier_apply(modifier=mo.name)
    mo=o.modifiers.new("Detalle superficie","SUBSURF");mo.levels=1;mo.render_levels=1
    for p in o.data.polygons:p.use_smooth=True
    return o
skin=union(["Pelvis bajo sudadera","Pierna.L","Pierna.R","Pie.L","Pie.R"]+["Dedo pie %d.%s"%(j,s) for s in ["L","R"] for j in range(3)],"Cuerpo pelaje | piernas y patas continuas",.018)
head=union(["Cabeza | mejillas anchas","Mechon mayor","Mechon menor"],"Cabeza | mejillas y mechones continuos",.017)
for side in ["L","R"]:
    union(["Mano."+side,"Pulgar."+side],"Mano continua."+side,.012)
    c=bpy.data.objects["Puno conectado."+side];c.location.z+=.03
    for v in c.data.vertices:v.co.z*=1.50
# One smooth heart-like blue tongue, not two balls.
union(["Lengua mitad -1","Lengua mitad 1"],"Lengua azul continua",.007)
# White throat fills the natural hoodie opening beneath the chin.
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(0,-.27,2.27))
neck=bpy.context.object
for c in list(neck.users_collection):c.objects.unlink(neck)
asset.objects.link(neck);neck.name="Cuello pelaje | union capucha";neck.scale=(.47,.25,.265)
neck.data.materials.append(fur)
for p in neck.data.polygons:p.use_smooth=True
trim=bpy.data.objects["Capucha ribete azul"]
for p in trim.data.splines[0].bezier_points:p.co.y-=.095;p.co.z+=.008
# Round brow ends.
for side in ["L","R"]:
    brow=bpy.data.objects["Ceja."+side]
    for k in [0,-1]:
        pt=brow.data.splines[0].bezier_points[k]
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=pt.co)
        o=bpy.context.object
        for c in list(o.users_collection):c.objects.unlink(o)
        asset.objects.link(o);o.name="Ceja extremo %s.%s"%(k,side);o.scale=(.021,.020,.022)
        o.data.materials.append(bpy.data.materials["v003 | Cejas"])
        for p in o.data.polygons:p.use_smooth=True
# Remove duplicate pole vertices and recalculate ear normals.
for side in ["L","R"]:
    o=bpy.data.objects["Oreja cuenco."+side]
    bm=bmesh.new();bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(o.data);bm.free();o.data.update()
# PBR adjustments for soft whites and rich blue instead of washed-out blue.
scene.view_settings.view_transform="Standard"
scene.view_settings.exposure=-.2
for name in ["Azul interior orejas","Ribetes azul","Lengua azul","Iris azul oscuro"]:
    m=bpy.data.materials["v003 | "+name];bs=next(n for n in m.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    bs.inputs["Specular IOR Level"].default_value=.20
bs=next(n for n in bpy.data.materials["v003 | Nariz y ojos"].node_tree.nodes if n.type=="BSDF_PRINCIPLED")
bs.inputs["Roughness"].default_value=.14;bs.inputs["Coat Weight"].default_value=.32
# Short groom curves for visual review (not a GLB export solution).
# Sample evaluated skin by triangle area. No source image modification.
rng=random.Random(173)
deps=bpy.context.evaluated_depsgraph_get()
groom=bpy.data.collections.new("PELAJE v003 | Estudio provisional")
scene.collection.children.link(groom)
targets=[("Cabeza | mejillas y mechones continuos",17000),("Oreja cuenco.L",3500),("Oreja cuenco.R",3500),("Mano continua.L",1500),("Mano continua.R",1500),("Cuerpo pelaje | piernas y patas continuas",5000)]
for name,count in targets:
    ob=bpy.data.objects[name];ev=ob.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles()
    tris=list(me.loop_triangles);cum=[];total=0
    for tr in tris:total+=tr.area;cum.append(total)
    cu=bpy.data.curves.new("Pelaje "+name,"CURVE");cu.dimensions="3D";cu.resolution_u=1;cu.bevel_depth=.00115;cu.bevel_resolution=0;cu.resolution_u=1
    for k in range(count):
        tr=tris[min(bisect.bisect_left(cum,rng.random()*total),len(tris)-1)]
        v0,v1,v2=[me.vertices[i] for i in tr.vertices]
        a=rng.random()**.5;b=rng.random()
        root=v0.co*(1-a)+v1.co*(a*(1-b))+v2.co*(a*b)
        no=(v0.normal*(1-a)+v1.normal*(a*(1-b))+v2.normal*(a*b)).normalized()
        worldroot=ob.matrix_world@root;wn=(ob.matrix_world.to_3x3()@no).normalized()
        # Lay down the fibres slightly, rising off the skin at the tip.
        direction=Vector((.25,0,-1));tan=(direction-wn*direction.dot(wn))
        if tan.length<.01:tan=Vector((1,0,0))
        tan.normalize()
        length=rng.uniform(.011,.026)
        pts=[worldroot+wn*.001,worldroot+tan*length*.45+wn*.006,worldroot+tan*length+wn*rng.uniform(.009,.016)]
        sp=cu.splines.new("POLY");sp.points.add(2)
        for p,co,r in zip(sp.points,pts,[.60,.48,.03]):p.co=(*co,1);p.radius=r
    hair=bpy.data.objects.new("Pelaje corto | "+name,cu);groom.objects.link(hair);cu.materials.append(fur)
    hair["estado"]="Pelaje provisional para revision; requiere solucion compatible con GLB"
    ev.to_mesh_clear()
scene["limites"]="Profundidad y espalda inferidas; bordado reconstruido; pelaje de curvas provisional. Sin rig ni acciones."
scene.render.filepath=r"C:\Users\Admin\Documents\MiBazarPE\assets\bazi\04_modelo_3d\iteraciones\v003\frontal.png"
bpy.ops.object.select_all(action="DESELECT");head.select_set(True);bpy.context.view_layer.objects.active=head
print("REFINED",len(asset.objects),"skin meshes; short hairs",32000)

