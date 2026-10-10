import bpy, math, random, bisect
from mathutils import Vector
s=bpy.context.scene;asset=bpy.data.collections["BAZI v003 | Geometria"];fur=bpy.data.materials["v003 | Pelaje marfil"]
head=bpy.data.objects["Cabeza | mejillas y mechones continuos"]
def chin(p):
    q=p.copy();q.z-=.125*math.exp(-(q.x/.72)**2)*math.exp(-((q.z-2.47)/.20)**2);return q
for v in head.data.vertices:v.co=chin(v.co)
oldhair=bpy.data.objects["Pelaje corto | Cabeza | mejillas y mechones continuos"];oldhair.hide_render=True;oldhair.hide_set(True)
neck=bpy.data.objects["Cuello pelaje | union capucha"];neck.location=(0,-.10,2.25);neck.scale=(.54,.30,.26)
# Fuller reflective black eye surfaces, with a very narrow lower blue iris rim.
for side in ["L","R"]:
    ob=bpy.data.objects["Pupila."+side];vs=list(ob.data.vertices);cy=sum(v.co.y for v in vs)/len(vs)
    cx=sum(v.co.x for v in vs)/len(vs);cz=sum(v.co.z for v in vs)/len(vs)
    for v in vs:
        v.co.y=cy+(v.co.y-cy)*2.05-.018
        v.co.x=cx+(v.co.x-cx)*1.025
        v.co.z=cz+(v.co.z-cz)*1.025
# Paw stance and asymmetry: wider toe box, slightly smaller outer toes.
def pawwarp(p):
    q=p.copy()
    if q.z<.60:
        w=min(1,max(0,(.60-q.z)/.20));sg=1 if q.x>0 else -1
        local=q.x-sg*.555
        q.x+=(sg*.055+local*.10)*w
        q.y+=.028*sg*local/.465*w*max(0,min(1,(-q.y-.22)/.23))
        q.z*=1-.07*max(0,sg*local/.465)*w
    return q
lower=bpy.data.objects["Patas v004 | anatomia continua"];inv=lower.matrix_world.inverted()
for v in lower.data.vertices:v.co=inv@pawwarp(lower.matrix_world@v.co)
for sp in bpy.data.objects["Pelaje patas v004"].data.splines:
    for p in sp.points:q=pawwarp(p.co.to_3d());p.co=(*q,p.co.w)
# A rounded tongue surface (smooth sampled outline, convex thickness).
old=bpy.data.objects["Lengua | sonrisa azul"];old.hide_render=True;old.hide_set(True)
pts=[(-.17,2.81),(-.145,2.849),(-.085,2.861),(0,2.835),(.085,2.861),(.145,2.849),(.17,2.81),(.151,2.766),(.085,2.725),(0,2.716),(-.085,2.725),(-.151,2.766)]
outline=[]
for k in range(len(pts)):
    a,b,c,d=[Vector(pts[i%len(pts)]) for i in [k-1,k,k+1,k+2]]
    for j in range(8):
        t=j/8
        q=.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)
        outline.append(q)
n=len(outline);vs=[];fs=[]
for k in range(1,9):
    r=k/8
    for p in outline:
        x=p.x*r;z=2.789+(p.y-2.789)*r-.045
        y=-.953-.022*(1-r*r)
        vs.append((x,y,z))
vs.append((0,-.975,2.744));center=len(vs)-1
for j in range(n):fs.append((center,j,(j+1)%n))
for k in range(7):
    for j in range(n):fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
me=bpy.data.meshes.new("Lengua suave");me.from_pydata(vs,[],fs);me.update()
ob=bpy.data.objects.new("Lengua v004 | corazon suave",me);asset.objects.link(ob);me.materials.append(bpy.data.materials["v003 | Lengua azul"])
so=ob.modifiers.new("Espesor","SOLIDIFY");so.thickness=.012
for p in me.polygons:p.use_smooth=True
# Contact shading adds depth in the ear bowls and around facial recesses.
for name,dist,strength in [("v003 | Pelaje marfil",.12,.28),("v003 | Azul interior orejas",.30,.60),("v003 | Sudadera carbon",.14,.35)]:
    ma=bpy.data.materials[name];nt=ma.node_tree;bs=next(n for n in nt.nodes if n.type=="BSDF_PRINCIPLED")
    base=tuple(bs.inputs["Base Color"].default_value)
    ao=nt.nodes.new("ShaderNodeAmbientOcclusion");ao.inputs["Distance"].default_value=dist;ao.samples=8
    ramp=nt.nodes.new("ShaderNodeValToRGB");ramp.color_ramp.elements[0].position=.10;ramp.color_ramp.elements[0].color=tuple(v*(1-strength) for v in base[:3])+(1,)
    ramp.color_ramp.elements[1].position=.92;ramp.color_ramp.elements[1].color=base
    nt.links.new(ao.outputs["AO"],ramp.inputs["Fac"]);nt.links.new(ramp.outputs["Color"],bs.inputs["Base Color"])
# Skin underneath the fur should be smooth; avoid the rough snow/granule effect.
for node in fur.node_tree.nodes:
    if node.type=="BUMP":node.inputs["Strength"].default_value=.045;node.inputs["Distance"].default_value=.002
hairmat=bpy.data.materials.new("v004 | Fibra suave marfil");hairmat.use_nodes=True
bs=next(n for n in hairmat.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
bs.inputs["Base Color"].default_value=(.84,.825,.81,1);bs.inputs["Roughness"].default_value=.72
bs.inputs["Specular IOR Level"].default_value=.18;bs.inputs["Sheen Weight"].default_value=.20
# Longer, denser, combed fibres instead of short points. Standalone groom for review only.
rng=random.Random(4404);deps=bpy.context.evaluated_depsgraph_get();ev=head.evaluated_get(deps);me=ev.to_mesh();me.calc_loop_triangles()
tris=list(me.loop_triangles);cum=[];total=0
for tr in tris:total+=tr.area;cum.append(total)
cu=bpy.data.curves.new("Pelaje peinado cabeza v004","CURVE");cu.dimensions="3D";cu.bevel_depth=.00085;cu.bevel_resolution=0
for k in range(80000):
    tr=tris[min(bisect.bisect_left(cum,rng.random()*total),len(tris)-1)]
    a=rng.random()**.5;b=rng.random();vv=[me.vertices[i] for i in tr.vertices]
    p=vv[0].co*(1-a)+vv[1].co*a*(1-b)+vv[2].co*a*b
    no=(vv[0].normal*(1-a)+vv[1].normal*a*(1-b)+vv[2].normal*a*b).normalized()
    direction=Vector((.18+.30*p.x,0,-.8))
    tan=direction-no*direction.dot(no)
    if tan.length<.01:tan=Vector((1,0,0))
    tan.normalize();length=rng.uniform(.025,.048)
    sp=cu.splines.new("POLY");sp.points.add(3)
    pp=[p+no*.001,p+tan*length*.30+no*.0035,p+tan*length*.70+no*.006,p+tan*length+no*.009]
    for v,q,r in zip(sp.points,pp,[.65,.53,.29,.015]):v.co=(*q,1);v.radius=r
ob=bpy.data.objects.new("Pelaje peinado cabeza v004",cu);asset.objects.link(ob);cu.materials.append(hairmat);ev.to_mesh_clear()
# Material preview is for editing; the Cycles camera preview below is the lighting authority.
s.cycles.samples=64;s.render.resolution_x=1100;s.render.resolution_y=1100
bpy.ops.object.select_all(action="DESELECT")
bpy.ops.wm.save_as_mainfile(filepath=r"C:\Users\Admin\Documents\MiBazarPE\assets\bazi\04_modelo_3d\iteraciones\v004\Bazi_v004.blend")
print("V004_FINE_PASS_DONE")

