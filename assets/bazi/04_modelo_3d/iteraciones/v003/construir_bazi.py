"""Bazi v003: new procedural 3D visual study built from approved front illustration.
No original scene, texture or file is removed or overwritten.
Front=-Y, Z up. Not yet a production rig or web-ready GLB.
"""
import bpy, math, json, random
from mathutils import Vector, Quaternion
from pathlib import Path
BASE=Path(r"C:\Users\Admin\Documents\MiBazarPE\assets\bazi")
OUT=BASE/"04_modelo_3d/iteraciones/v003"
OUT.mkdir(parents=True,exist_ok=True)
if (OUT/"Bazi_v003.blend").exists(): raise RuntimeError("Iteration exists; refusing overwrite.")
scene=bpy.data.scenes.new("BAZI v003 | Revision de parecido")
bpy.context.window.scene=scene
asset=bpy.data.collections.new("BAZI v003 | Geometria")
scene.collection.children.link(asset)
studio=bpy.data.collections.new("ESTUDIO v003")
scene.collection.children.link(studio)
refs=bpy.data.collections.new("REFERENCIAS v003 | Originales")
scene.collection.children.link(refs)

def mesh(name,vs,fs,mat,sub=0,col=asset):
    me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update()
    ob=bpy.data.objects.new(name,me);col.objects.link(ob);me.materials.append(mat)
    for p in me.polygons:p.use_smooth=True
    if sub:
        mo=ob.modifiers.new("Superficie suave","SUBSURF");mo.levels=sub;mo.render_levels=sub
    return ob
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def material(name,color,rough=.5,tex=None):
    rgb=[linear(int(color[i:i+2],16)/255) for i in (0,2,4)]
    ma=bpy.data.materials.new("v003 | "+name);ma.use_nodes=True;ma.diffuse_color=(*rgb,1)
    bs=next(n for n in ma.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    bs.inputs["Base Color"].default_value=(*rgb,1);bs.inputs["Roughness"].default_value=rough
    bs.inputs["Specular IOR Level"].default_value=.28
    if tex:
        coord=ma.node_tree.nodes.new("ShaderNodeTexCoord")
        n=ma.node_tree.nodes.new("ShaderNodeTexNoise");n.inputs["Scale"].default_value=tex[0];n.inputs["Detail"].default_value=2
        ma.node_tree.links.new(coord.outputs["Generated"],n.inputs["Vector"])
        bump=ma.node_tree.nodes.new("ShaderNodeBump");bump.inputs["Strength"].default_value=tex[1];bump.inputs["Distance"].default_value=tex[2]
        ma.node_tree.links.new(n.outputs["Fac"],bump.inputs["Height"]);ma.node_tree.links.new(bump.outputs["Normal"],bs.inputs["Normal"])
    return ma
fur=material("Pelaje marfil","F5F3F2",.65,(170,.18,.012))
white=material("Blanco ojos","F9FAFD",.35)
blue=material("Azul interior orejas","0061F3",.48)
cyan=material("Ribetes azul","008EFF",.43)
tongue=material("Lengua azul","0076F5",.4)
hoodmat=material("Sudadera carbon","191B22",.8,(150,.28,.008))
ribmat=material("Tejido punos","101218",.86,(190,.24,.008))
strapmat=material("Correa mochila","25272E",.64,(190,.22,.004))
black=material("Nariz y ojos","08090D",.22)
iris=material("Iris azul oscuro","006BDE",.25)
mouth=material("Interior boca","08060D",.95)
browmat=material("Cejas","211E1F",.85)

def ell(name,loc,sc,ma,seg=48,rings=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc)
    ob=bpy.context.object
    for co in list(ob.users_collection):co.objects.unlink(ob)
    asset.objects.link(ob);ob.name=name;ob.scale=sc
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(ma)
    for p in ob.data.polygons:p.use_smooth=True
    return ob
def curve(name,pts,radius,ma,cycle=False,col=asset):
    cu=bpy.data.curves.new(name,"CURVE");cu.dimensions="3D";cu.resolution_u=20;cu.bevel_depth=radius;cu.bevel_resolution=4;cu.use_fill_caps=True
    sp=cu.splines.new("BEZIER");sp.bezier_points.add(len(pts)-1)
    for p,co in zip(sp.bezier_points,pts):p.co=co;p.handle_left_type="AUTO";p.handle_right_type="AUTO"
    sp.use_cyclic_u=cycle
    if not cycle:sp.bezier_points[0].radius=.55;sp.bezier_points[-1].radius=.55
    ob=bpy.data.objects.new(name,cu);col.objects.link(ob);cu.materials.append(ma);return ob
def loft(name,rows,ma,sub=2,flat=.85,n=64):
    # Each row: (z, radiusX, radiusY, centerY). Closed surfaces, no floating cutout.
    vs=[]
    for z,rx,ry,cy in rows:
        for j in range(n):
            a=2*math.pi*j/n;s=math.sin(a)
            ys=math.copysign(abs(s)**flat,s)
            vs.append((rx*math.cos(a),cy+ry*ys,z))
    fs=[tuple(reversed(range(n)))]
    for k in range(len(rows)-1):
        for j in range(n):fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
    fs.append(tuple((len(rows)-1)*n+j for j in range(n)))
    return mesh(name,vs,fs,ma,sub)
headrows=[(2.42,.10,.15,.06),(2.45,.48,.35,.06),(2.52,.87,.53,.04),(2.67,1.13,.68,.025),(2.88,1.24,.77,.02),(3.08,1.24,.80,.01),(3.38,1.16,.785,.02),(3.66,1.03,.69,.025),(3.94,.83,.55,.03),(4.10,.60,.40,.04),(4.22,.32,.21,.05),(4.26,.045,.04,.05)]
head=loft("Cabeza | mejillas anchas",headrows,fur,2,.5)
def headfront(x,z):
    for a,b in zip(headrows,headrows[1:]):
        if a[0]<=z<=b[0]:
            t=(z-a[0])/(b[0]-a[0]);rx=a[1]*(1-t)+b[1]*t;ry=a[2]*(1-t)+b[2]*t;cy=a[3]*(1-t)+b[3]*t
            return cy-ry*max(.01,1-(x/rx)**2)**.25
    return -.75
# Soft compact torso and connected short legs.
ell("Pelvis bajo sudadera",(0,.10,.87),(.85,.43,.40),fur)
torso=loft("Sudadera | torso continuo",[(.82,.77,.40,0),(.88,.88,.46,0),(1.10,.99,.51,0),(1.40,1.00,.51,0),(1.77,.93,.49,.01),(2.10,.83,.43,.025),(2.28,.63,.31,.03),(2.31,.35,.22,.04)],hoodmat,2,.72)
loft("Cintura tejida",[(.81,.75,.39,0),(.85,.91,.465,0),(.96,.975,.51,0),(1.01,.969,.50,0)],ribmat,1,.72)
for sign,side in [(-1,"R"),(1,"L")]:
    leg=ell("Pierna."+side,(sign*.50,.055,.48),(.405,.38,.48),fur)
    foot=ell("Pie."+side,(sign*.54,-.16,.185),(.48,.47,.175),fur)
    for j in range(3):
        ell("Dedo pie %d.%s"%(j,side),(sign*.54+(j-1)*.185,-.415,.135),(.17,.20,.135),fur,32,20)
# Ears are recessed bowls, continuous radial surface, not torus stacked over discs.
for sign,side in [(-1,"R"),(1,"L")]:
    rows=[(0,.11),(.12,.075),(.255,.06),(.31,.012),(.365,-.055),(.43,-.105),(.495,-.02),(.54,.065),(.555,.18),(.53,.27),(.44,.34),(.28,.385),(0,.40)]
    n=64;vs=[]
    for r,y in rows:
        for j in range(n):
            a=2*math.pi*j/n;vs.append((sign*1.035+r*math.cos(a),.04+y,3.965+1.025*r*math.sin(a)))
    fs=[]
    for k in range(len(rows)-1):
        for j in range(n):fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
    ear=mesh("Oreja cuenco."+side,vs,fs,fur,1)
    ear.data.materials.append(blue)
    for p in ear.data.polygons:
        if p.index//n<3:p.material_index=1
# Facial parts sit close to the face. The blue iris is a narrow lower crescent.
for sign,side in [(-1,"R"),(1,"L")]:
    x=sign*.485;z=3.23;y=headfront(x,z)
    ell("Contorno ojo."+side,(x,y-.016,z),(.200,.070,.227),browmat)
    ell("Ojo blanco."+side,(x,y-.037,z+.005),(.192,.064,.218),white)
    ell("Iris."+side,(x-sign*.012,y-.088,z-.005),(.161,.032,.191),iris)
    ell("Pupila."+side,(x-sign*.012,y-.105,z+.02),(.153,.026,.177),black)
    ell("Brillo ojo."+side,(x+.055,y-.135,z+.113),(.038,.009,.040),white,24,16)
    glint=material("Reflejo tenue."+side,"263042",.35)
    ell("Reflejo secundario."+side,(x-.078,y-.13,z+.045),(.022,.009,.028),glint,24,16)
    pts=[(sign*.382,headfront(sign*.382,3.677)-.018,3.677),(sign*.448,headfront(sign*.448,3.698)-.019,3.698),(sign*.563,headfront(sign*.563,3.65)-.018,3.65)]
    curve("Ceja."+side,pts,.031,browmat)
# Smile shaped like the original: wide upper corners, rounded lower tip.
outline=[(-.292,3.005),(-.242,2.94),(-.14,2.92),(0,2.925),(.14,2.92),(.242,2.94),(.292,3.005),(.272,2.90),(.227,2.795),(.15,2.725),(0,2.70),(-.15,2.725),(-.227,2.795),(-.272,2.90)]
# triangle fan curved on the head rather than an oval sphere protruding from it
vs=[(0,headfront(0,2.858)-.018,2.858)]+[(x,headfront(x,z)-.018,z) for x,z in outline]
fs=[(0,i+1,(i+1)%len(outline)+1) for i in range(len(outline))]
smile=mesh("Sonrisa | cavidad unica",vs,fs,mouth)
for sign in [-1,1]:
    ell("Lengua mitad "+str(sign),(sign*.081,headfront(sign*.081,2.78)-.038,2.791),(.094,.025,.094),tongue,40,24)
    ell("Hocico suave "+str(sign),(sign*.129,headfront(sign*.129,3.02)-.015,3.026),(.161,.066,.088),fur)
nose=ell("Nariz pequena",(0,headfront(0,3.116)-.086,3.116),(.155,.072,.086),black)
for v in nose.data.vertices:
    if v.co.z<0:v.co.x*=.58+.42*(v.co.z/.086+1)
curve("Filtrum",[(0,headfront(0,3.066)-.10,3.066),(0,headfront(0,3.007)-.08,3.007)],.009,browmat)
# Curved tapered tufts flowing out of forehead, not triangles floating on top.
def tuft(name,centers,radii):
    n=32;vs=[]
    for co,r in zip(centers,radii):
        for j in range(n):
            a=math.tau*j/n;vs.append((co[0]+r*math.cos(a),co[1]+r*.72*math.sin(a),co[2]))
    fs=[tuple(reversed(range(n)))]
    for k in range(len(centers)-1):
        for j in range(n):fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
    fs.append(tuple((len(centers)-1)*n+j for j in range(n)))
    return mesh(name,vs,fs,fur,2)
tuft("Mechon mayor",[(-.20,.01,4.12),(-.08,.01,4.235),(.055,.025,4.36),(.13,.03,4.53)],[.22,.16,.09,.004])
tuft("Mechon menor",[(.10,-.01,4.16),(.18,-.015,4.27),(.245,-.01,4.40)],[.16,.095,.005])
# Thick folded hood behind chin, V-shaped blue trim visible above front.
hoodpts=[]
for j in range(64):
    a=math.tau*j/64;s=math.sin(a)
    hoodpts.append((1.065*math.cos(a),.43*s,2.35+.055*max(0,s)-.31*max(0,-s)**7))
curve("Capucha acolchada",hoodpts,.145,hoodmat,True)
curve("Capucha ribete azul",[(x,y-.025,z+.105) for x,y,z in hoodpts],.042,cyan,True)
# Complete sleeves following shoulders->elbows->wrists; each is one closed loft.
def sleeve(side,sgn):
    centers=[(sgn*.76,.015,2.19,.25,.27),(sgn*.89,.015,2.11,.30,.30),(sgn*1.02,-.01,1.90,.30,.325),(sgn*1.20,-.025,1.61,.32,.34),(sgn*1.31,-.055,1.40,.31,.34),(sgn*1.31,-.06,1.27,.275,.30)]
    n=40;vs=[]
    for k,(x,y,z,rx,ry) in enumerate(centers):
        for j in range(n):
            a=math.tau*j/n;fold=1+.025*math.sin(a*3+k*.9)
            vs.append((x+rx*math.cos(a)*fold,y+ry*math.sin(a)*fold,z))
    fs=[tuple(reversed(range(n)))]
    for k in range(len(centers)-1):
        for j in range(n):fs.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
    fs.append(tuple((len(centers)-1)*n+j for j in range(n)))
    ob=mesh("Manga completa."+side,vs,fs,hoodmat,2)
    cuff=ell("Puno conectado."+side,(sgn*1.32,-.07,1.235),(.294,.315,.105),ribmat)
    cuff.rotation_euler.y=sgn*.25
    ell("Mano."+side,(sgn*1.33,-.08,1.00),(.295,.285,.279),fur)
    ell("Pulgar."+side,(sgn*1.14,-.27,1.005),(.108,.105,.136),fur)
for s,side in [(-1,"R"),(1,"L")]:sleeve(side,s)
# Flat backpack straps (rounded rectangular ribbons).
def ribbon(name,centers,width,depth,ma):
    vs=[]
    for x,y,z in centers:vs.extend([(x-width/2,y-depth/2,z),(x+width/2,y-depth/2,z),(x+width/2,y+depth/2,z),(x-width/2,y+depth/2,z)])
    fs=[(3,2,1,0)]
    for k in range(len(centers)-1):
        for j in range(4):fs.append((4*k+j,4*k+(j+1)%4,4*(k+1)+(j+1)%4,4*(k+1)+j))
    fs.append(tuple(4*(len(centers)-1)+j for j in range(4)))
    ob=mesh(name,vs,fs,ma)
    be=ob.modifiers.new("Bordes redondos","BEVEL");be.width=.025;be.segments=3
    no=ob.modifiers.new("Normales","WEIGHTED_NORMAL")
    return ob
for sg,side in [(-1,"R"),(1,"L")]:
    ribbon("Correa plana."+side,[(sg*.76,-.15,2.23),(sg*.805,-.375,2.08),(sg*.84,-.505,1.82),(sg*.86,-.515,1.62),(sg*.89,-.36,1.47)],.19,.08,strapmat)
    curve("Costura correa."+side,[(sg*.745,-.43,2.06),(sg*.781,-.558,1.83),(sg*.802,-.563,1.66)],.008,ribmat)
    ell("Hebilla."+side,(sg*.853,-.569,1.681),(.069,.02,.031),cyan,24,16)
    curve("Cordon."+side,[(sg*.231,-.455,2.14),(sg*.232,-.531,1.97),(sg*.235,-.57,1.75)],.028,cyan)
    ell("Ojal."+side,(sg*.231,-.47,2.145),(.053,.026,.044),blue,24,16)
    ell("Nudo cordon."+side,(sg*.235,-.571,1.73),(.058,.041,.054),cyan,24,16)
    ell("Punta cordon."+side,(sg*.235,-.569,1.666),(.03,.032,.030),blue,24,16)
    curve("Ribete bolsillo."+side,[(sg*.55,-.523,1.475),(sg*.63,-.555,1.30),(sg*.72,-.52,1.065)],.044,cyan)
curve("Costura pecho",[(0,-.425,2.10),(0,-.521,1.72),(0,-.535,1.45),(0,-.528,1.05),(0,-.495,.90)],.006,ribmat)
curve("Bolsillo costura superior",[(-.565,-.529,1.47),(0,-.543,1.47),(.565,-.529,1.47)],.009,ribmat)
# Subtle fold curves that stay on body surface; low raised garment relief.
for sg in [-1,1]:
    curve("Pliegue lateral "+str(sg),[(sg*.90,-.35,1.59),(sg*.87,-.44,1.48),(sg*.81,-.50,1.43)],.011,hoodmat)
pack=ell("Mochila | posterior inferido",(0,.47,1.66),(.76,.33,.67),strapmat)
ell("Mochila bolsillo posterior",(0,.74,1.42),(.55,.10,.32),hoodmat)
curve("Cierre mochila",[(-.53,.76,1.43),(-.50,.78,1.67),(0,.80,1.78),(.50,.78,1.67),(.53,.76,1.43)],.012,blue)
# Small embroidered chest mark reconstructed from base (not a replacement logo asset).
def badge(name,xzs,ma):
    ob=mesh(name,[(x,-.521,z) for x,z in xzs],[tuple(range(len(xzs)))],ma)
    sol=ob.modifiers.new("Grosor bordado","SOLIDIFY");sol.thickness=.010
    be=ob.modifiers.new("Bordado redondo","BEVEL");be.width=.012;be.segments=3
badge("Bordado blanco",[(.353,1.596),(.353,1.825),(.543,1.674),(.494,1.632),(.405,1.702),(.405,1.596)],white)
badge("Bordado corazon",[(.515,1.804),(.516,1.85),(.55,1.875),(.59,1.85),(.631,1.88),(.654,1.855),(.65,1.82),(.59,1.76)],blue)
ell("Bordado gota",(.627,-.531,1.649),(.029,.012,.041),cyan,24,16)
# Original references embedded as nonrendering empties in a separate collection.
for name,rel,x in [("Referencia BASE","01_conceptos/02_bazi_pose_base.png",-3.75),("Referencia SALUDO","02_bocetos_funcionales/08_bazi_saludando.png",3.75)]:
    im=bpy.data.images.load(str(BASE/rel),check_existing=True);im.pack()
    ob=bpy.data.objects.new(name,None);refs.objects.link(ob);ob.empty_display_type="IMAGE";ob.data=im
    ob.empty_display_size=4.80;ob.location=(x,.90,2.24);ob.rotation_euler=(math.pi/2,0,0);ob.empty_image_depth="BACK";ob.hide_render=True
# Studio
floor_mat=material("Suelo estudio","D7DEEA",.8)
me=bpy.data.meshes.new("Suelo");me.from_pydata([(-200,-200,-.01),(200,-200,-.01),(200,200,-.01),(-200,200,-.01)],[],[(0,1,2,3)])
ob=bpy.data.objects.new("Suelo estudio",me);studio.objects.link(ob);me.materials.append(floor_mat)
world=bpy.data.worlds.new("v003 | Estudio");world.use_nodes=True;scene.world=world
bg=next(n for n in world.node_tree.nodes if n.type=="BACKGROUND");bg.inputs["Color"].default_value=(.40,.45,.55,1);bg.inputs["Strength"].default_value=.32
def area(name,loc,power,size,color):
    d=bpy.data.lights.new(name,"AREA");d.energy=power;d.shape="DISK";d.size=size;d.color=color
    ob=bpy.data.objects.new(name,d);studio.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((0,0,2.4))-ob.location).to_track_quat("-Z","Y").to_euler()
area("Principal",(-4,-5,7),650,5,(1,.95,.91));area("Relleno",(4,-3,4),250,4,(.78,.88,1));area("Rim",(1,4,6),600,3,(.60,.78,1))
d=bpy.data.cameras.new("Bazi camara frontal");cam=bpy.data.objects.new("Bazi camara frontal",d);studio.objects.link(cam);scene.camera=cam
d.type="ORTHO";d.ortho_scale=5.05;cam.location=(0,-10,2.27);cam.rotation_euler=(math.pi/2,0,0)
scene.render.engine="CYCLES";scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.view_settings.view_transform="AgX"
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(OUT/"frontal.png")
scene["estado"]="Revision visual v003; sin rig ni animaciones. No aprobado para integracion."
scene["fuentes"]="02_bazi_pose_base.png; 08_bazi_saludando.png. Guias 10-14 descartadas por otro diseno."
scene["limites"]="Profundidad y espalda inferidas. Bordado reconstruido. Pelaje microrelieve provisional; falta pelo y optimizacion."
for screen in bpy.data.screens:
    for ar in screen.areas:
        if ar.type=="VIEW_3D":
            sp=ar.spaces.active;sp.region_3d.view_distance=7;sp.region_3d.view_location=(0,0,2.27)
            sp.region_3d.view_rotation=Quaternion((1,0,0),math.pi/2);sp.region_3d.view_perspective="ORTHO"
            sp.shading.type="MATERIAL";sp.overlay.show_extras=False
bpy.ops.object.select_all(action="DESELECT");head.select_set(True);bpy.context.view_layer.objects.active=head
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"Bazi_v003.blend"))
print("BAZI_V003_CREATED",len(asset.objects),"objects",str(OUT))

