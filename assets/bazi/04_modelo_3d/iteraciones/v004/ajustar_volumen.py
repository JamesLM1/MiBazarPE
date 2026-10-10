import bpy, math, bmesh, random, bisect
from mathutils import Vector
s=bpy.context.scene
asset=bpy.data.collections["BAZI v003 | Geometria"]
fur=bpy.data.materials["v003 | Pelaje marfil"]
dark=bpy.data.materials["v003 | Sudadera carbon"]
rib=bpy.data.materials["v003 | Tejido punos"]
blue=bpy.data.materials["v003 | Ribetes azul"]
def mesh(name,vs,fs,ma,sub=0):
    me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update()
    ob=bpy.data.objects.new(name,me);asset.objects.link(ob);me.materials.append(ma)
    for p in me.polygons:p.use_smooth=True
    if sub:
        mod=ob.modifiers.new("Superficie","SUBSURF");mod.levels=sub;mod.render_levels=sub
    return ob
def ell(name,loc,scale,ma):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=32,location=loc)
    ob=bpy.context.object
    for co in list(ob.users_collection):co.objects.unlink(ob)
    asset.objects.link(ob);ob.name=name;ob.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(ma)
    for p in ob.data.polygons:p.use_smooth=True
    return ob
def tube(name,points,radius,ma):
    cu=bpy.data.curves.new(name,"CURVE");cu.dimensions="3D";cu.resolution_u=18;cu.bevel_depth=radius;cu.bevel_resolution=3;cu.use_fill_caps=True
    sp=cu.splines.new("BEZIER");sp.bezier_points.add(len(points)-1)
    for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type="AUTO";p.handle_right_type="AUTO"
    sp.bezier_points[0].radius=.1;sp.bezier_points[-1].radius=.1
    ob=bpy.data.objects.new(name,cu);asset.objects.link(ob);cu.materials.append(ma);return ob
def union(obs,name,voxel):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in obs:ob.select_set(True)
    bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();ob=bpy.context.object;ob.name=name
    mod=ob.modifiers.new("Union de volumenes","REMESH");mod.mode="VOXEL";mod.voxel_size=voxel;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=ob.modifiers.new("Suavizado controlado","SMOOTH");mod.factor=.65;mod.iterations=3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=ob.modifiers.new("Superficie final","SUBSURF");mod.levels=1;mod.render_levels=1
    return ob
# Fuller lower cheeks and deeper face: transform skin and its existing groom together.
def headwarp(p):
    p=p.copy()
    w=math.exp(-((p.z-2.97)/.58)**2)
    p.x*=1+.11*w
    p.y*=1.13
    if p.y<0:
        p.y-=.06*math.exp(-((abs(p.x)-.72)/.43)**2)*w
    p.z-=.045
    return p
head=bpy.data.objects["Cabeza | mejillas y mechones continuos"]
for v in head.data.vertices:v.co=headwarp(v.co)
hair=bpy.data.objects["Pelaje corto | Cabeza | mejillas y mechones continuos"]
for sp in hair.data.splines:
    for p in sp.points:
        q=headwarp(p.co.to_3d());p.co=(*q,p.co.w)
# Face pieces follow the new face depth. Keep eyes close together within fuller cheeks.
prefixes=("Contorno ojo.","Ojo blanco.","Iris.","Pupila.","Brillo ojo.","Reflejo secundario.","Ceja.","Ceja extremo","Nariz pequena","Hocico suave","Filtrum","Sonrisa |","Lengua |")
for ob in list(asset.objects):
    if not ob.name.startswith(prefixes):continue
    if ob.type=="MESH":
        inv=ob.matrix_world.inverted()
        for v in ob.data.vertices:
            p=ob.matrix_world@v.co;q=headwarp(p);q.x=p.x*1.025;v.co=inv@q
    elif ob.type=="CURVE":
        for sp in ob.data.splines:
            for p in sp.bezier_points:
                co=p.co.copy();q=headwarp(co);q.x=co.x*1.025;p.co=q
# Hide the old flipper-like lower body and groom, preserving the v003 file on disk.
for name in ["Cuerpo pelaje | piernas y patas continuas","Pelaje corto | Cuerpo pelaje | piernas y patas continuas"]:
    ob=bpy.data.objects[name];ob.hide_render=True;ob.hide_set(True)
parts=[ell("V4 pelvis",(0,.09,.91),(.88,.44,.35),fur)]
for sg,side in [(-1,"R"),(1,"L")]:
    parts.append(ell("V4 pierna."+side,(sg*.49,.045,.665),(.375,.345,.455),fur))
    # Rounded rectangular foot with a broad, level sole.
    vs=[];fs=[];n=64;m=32
    for i in range(m+1):
        ph=math.pi*i/m
        for j in range(n):
            a=math.tau*j/n
            def spow(v,p):return math.copysign(abs(v)**p,v)
            x=sg*.555+.465*spow(math.cos(a),.75)*math.sin(ph)**.70
            y=-.13+.39*spow(math.sin(a),.8)*math.sin(ph)**.70
            z=.228+.214*spow(math.cos(ph),.65)
            vs.append((x,y,z))
    for i in range(m):
        for j in range(n):fs.append((i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j))
    paw=mesh("V4 empeine."+side,vs,fs,fur);parts.append(paw)
    for j in range(3):
        toe=ell("V4 dedo %d.%s"%(j,side),(sg*.555+(j-1)*.258,-.435,.212),(.195,.235,.195),fur)
        parts.append(toe)
lower=union(parts,"Patas v004 | anatomia continua",.011)
# Gentle interdigital valleys, extending back from the front instead of cutting vertically through.
inv=lower.matrix_world.inverted()
for v in lower.data.vertices:
    p=lower.matrix_world@v.co
    if p.y<-.38 and p.z>.12 and p.z<.38:
        d=0
        for sg in [-1,1]:
            for gx in [sg*.555-.129,sg*.555+.129]:
                d+=.026*math.exp(-((p.x-gx)/.025)**2)*math.exp(-((p.z-.245)/.105)**2)
        p.y+=d;v.co=inv@p
# Garment folds are geometry. Work on evaluated meshes so these folds are not rounded away.
for name in ["Manga completa.L","Manga completa.R","Sudadera | torso continuo"]:
    ob=bpy.data.objects[name]
    bpy.ops.object.select_all(action="DESELECT");ob.hide_set(False);ob.select_set(True);bpy.context.view_layer.objects.active=ob
    for mod in list(ob.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    for v in ob.data.vertices:
        p=ob.matrix_world@v.co
        if name.startswith("Manga"):
            sg=1 if name.endswith(".L") else -1
            u=abs(p.x);front=max(0,min(1,(-p.y+.02)/.25))
            d=0
            for zc,amp,width in [(1.50,.034,.045),(1.70,.027,.045),(1.89,.020,.050)]:
                line=zc+.48*(u-1.12)
                d+=amp*math.exp(-((p.z-line)/width)**2)-amp*.50*math.exp(-((p.z-line-.055)/.029)**2)
            p.y-=d*front
            p.x+=sg*.018*math.exp(-((p.z-1.58)/.26)**2)
        else:
            p.y*=1.065
            if p.y<0:
                d=.019*math.exp(-((p.z-(1.10+.10*abs(p.x)))/.055)**2)
                d+=.016*math.exp(-((abs(p.x)-.78)/.10)**2)*math.exp(-((p.z-1.72)/.32)**2)
                p.y-=d
        v.co=ob.matrix_world.inverted()@p
    mod=ob.modifiers.new("Acabado de tela","SUBSURF");mod.levels=1;mod.render_levels=1
# Front details follow the fuller sweatshirt.
for ob in asset.objects:
    if ob.name.startswith(("Correa plana.","Costura correa.","Cordon.","Nudo cordon.","Punta cordon.","Ojal.","Hebilla rectangular.","Bordado","Ribete plano bolsillo.")):
        if ob.type=="MESH":ob.location.y-=.028
        elif ob.type=="CURVE":
            for sp in ob.data.splines:
                for p in sp.bezier_points:p.co.y-=.028
# Actual raised kangaroo pocket, curved to the torso.
vs=[];fs=[];nx=32;nz=16
for k in range(nz+1):
    t=k/nz;z=1.00+.47*t;w=.78-.21*t
    for j in range(nx+1):
        x=(-1+2*j/nx)*w;y=-.571+.065*(abs(x)/.79)**2
        y-=.013*math.sin(math.pi*t)
        vs.append((x,y,z))
for k in range(nz):
    for j in range(nx):
        i=k*(nx+1)+j;fs.append((i,i+1,i+nx+2,i+nx+1))
pocket=mesh("Bolsillo canguro | volumen",vs,fs,dark,1)
so=pocket.modifiers.new("Espesor bolsillo","SOLIDIFY");so.thickness=.012
tube("Costura bolsillo superior v4",[(-.55,-.548,1.477),(0,-.579,1.477),(.55,-.548,1.477)],.007,rib)
tube("Costura bolsillo inferior v4",[(-.75,-.518,1.035),(0,-.579,1.01),(.75,-.518,1.035)],.006,rib)
# Fine rib knitting on cuffs and hem via shader, not thick geometric hoops.
for ma in [dark,rib]:
    bs=next(n for n in ma.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    bs.inputs["Roughness"].default_value=.77;bs.inputs["Specular IOR Level"].default_value=.3
    coord=ma.node_tree.nodes.new("ShaderNodeTexCoord")
    mapping=ma.node_tree.nodes.new("ShaderNodeVectorMath");mapping.operation="SCALE";mapping.inputs[3].default_value=1
    wave=ma.node_tree.nodes.new("ShaderNodeTexWave");wave.inputs["Scale"].default_value=160 if ma==rib else 210
    wave.inputs["Distortion"].default_value=2.2 if ma==dark else .3
    bump=ma.node_tree.nodes.new("ShaderNodeBump");bump.inputs["Strength"].default_value=.22;bump.inputs["Distance"].default_value=.0024
    ma.node_tree.links.new(coord.outputs["Generated"],wave.inputs["Vector"]);ma.node_tree.links.new(wave.outputs["Color"],bump.inputs["Height"])
    previous=bs.inputs["Normal"].links
    if previous:ma.node_tree.links.new(previous[0].from_socket,bump.inputs["Normal"])
    ma.node_tree.links.new(bump.outputs["Normal"],bs.inputs["Normal"])
    bs.inputs["Sheen Weight"].default_value=.15
# More directional studio lighting restores cheeks, cloth relief and ear shadows.
world=next(n for n in s.world.node_tree.nodes if n.type=="BACKGROUND")
world.inputs["Strength"].default_value=.10
for name,loc,energy,size in [("Principal",(-3.6,-4.8,6.6),520,3.0),("Relleno",(4,-3.6,3.6),100,4.5),("Rim",(2.6,2.8,5.5),450,2.3)]:
    ob=bpy.data.objects[name];ob.location=loc;ob.data.energy=energy;ob.data.size=size
    ob.rotation_euler=(Vector((0,0,2.4))-ob.location).to_track_quat("-Z","Y").to_euler()
# OCIO view names verified from installed Blender config.
s.view_settings.view_transform="AgX";s.view_settings.look="AgX - Medium High Contrast";s.view_settings.exposure=.1
bs=next(n for n in fur.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
bs.inputs["Base Color"].default_value=(.82,.80,.79,1);bs.inputs["Roughness"].default_value=.56
bs.inputs["Subsurface Weight"].default_value=.035
bs.inputs["Sheen Weight"].default_value=.18
# New lower-body groom with hairs lying along the limbs and paws.
rng=random.Random(404);deps=bpy.context.evaluated_depsgraph_get();ev=lower.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles()
tris=list(me.loop_triangles);cum=[];total=0
for tr in tris:total+=tr.area;cum.append(total)
cu=bpy.data.curves.new("Pelaje patas v004","CURVE");cu.dimensions="3D";cu.bevel_depth=.00095;cu.bevel_resolution=0
for k in range(12000):
    tr=tris[min(bisect.bisect_left(cum,rng.random()*total),len(tris)-1)]
    a=rng.random()**.5;b=rng.random();vs3=[me.vertices[i] for i in tr.vertices]
    q=vs3[0].co*(1-a)+vs3[1].co*a*(1-b)+vs3[2].co*a*b
    n=(vs3[0].normal*(1-a)+vs3[1].normal*a*(1-b)+vs3[2].normal*a*b).normalized()
    p=lower.matrix_world@q;wn=(lower.matrix_world.to_3x3()@n).normalized()
    direction=Vector((0,-.35,-1));tan=direction-wn*direction.dot(wn)
    if tan.length<.01:tan=Vector((1,0,0))
    tan.normalize();length=rng.uniform(.010,.020)
    sp=cu.splines.new("POLY");sp.points.add(2)
    for pp,q,r in zip(sp.points,[p+wn*.001,p+tan*length*.5+wn*.004,p+tan*length+wn*.008],[.60,.35,.02]):pp.co=(*q,1);pp.radius=r
ob=bpy.data.objects.new("Pelaje patas v004",cu);asset.objects.link(ob);cu.materials.append(fur);ev.to_mesh_clear()
floor=bpy.data.objects["Suelo estudio"];floor.is_shadow_catcher=True
s.cycles.samples=64
s["estado"]="v004: revision de volumen, patas, tela e iluminacion; sin rig ni acciones"
bpy.ops.object.select_all(action="DESELECT")
bpy.ops.wm.save_as_mainfile(filepath=r"C:\Users\Admin\Documents\MiBazarPE\assets\bazi\04_modelo_3d\iteraciones\v004\Bazi_v004.blend")
print("V004_GEOMETRY_AND_LIGHTING")

