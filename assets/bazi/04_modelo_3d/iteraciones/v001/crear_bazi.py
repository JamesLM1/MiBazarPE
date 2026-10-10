"""Bazi: editable local visual prototype, never overwrites an existing iteration.
Run with Blender --background --factory-startup --python crear_bazi.py -- --output NEW_DIR
Front is -Y; Z is up. Reference: 02_bazi_pose_base.png. Back/depth are inferred.
"""
import bpy, math, json, sys, argparse
from pathlib import Path
from mathutils import Vector, Quaternion

parser=argparse.ArgumentParser()
parser.add_argument('--output', required=True)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
OUT=Path(args.output).resolve()
OUT.mkdir(parents=True,exist_ok=True)
if (OUT/'Bazi_v001.blend').exists():
    raise RuntimeError('Output already contains a model; choose a new iteration directory.')
ROOT=Path(__file__).resolve().parents[3]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
asset=bpy.data.collections.new('BAZI | Prototipo visual v001')
scene.collection.children.link(asset)
studio=bpy.data.collections.new('ESTUDIO | Solo revision')
scene.collection.children.link(studio)
def move(obj,col=asset):
    for c in list(obj.users_collection): c.objects.unlink(obj)
    col.objects.link(obj)
    return obj
def mat(name,hexcolor,rough=.5,noise=0):
    c=[int(hexcolor[i:i+2],16)/255 for i in (0,2,4)]
    c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
    m=bpy.data.materials.new(name); m.diffuse_color=(*c,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*c,1)
    bs.inputs['Roughness'].default_value=rough
    if noise:
        n=m.node_tree.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=155
        bump=m.node_tree.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.16
        bump.inputs['Distance'].default_value=noise
        m.node_tree.links.new(n.outputs['Fac'],bump.inputs['Height']); m.node_tree.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    return m
white=mat('Pelaje blanco | microrelieve provisional','F5F7FF',.66,.013)
blue=mat('Azul marca 0066FF','0066FF',.38)
cyan=mat('Azul ribete iluminado','009CF5',.4)
dark=mat('Sudadera negra','15161E',.82,.012)
rib=mat('Punos y cintura','101118',.78,.009)
strap=mat('Mochila y correas','22242C',.5)
black=mat('Pupilas nariz boca','04050A',.2)
mouthmat=mat('Interior boca','080611',.8)
eyewhite=mat('Esclerotica','FFFFFF',.27)
def finish(o,name,m):
    o.name=name; move(o)
    o.data.materials.append(m)
    if o.type=='MESH':
        for p in o.data.polygons: p.use_smooth=True
    return o
def ell(name,loc,scale,m,seg=40,rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc)
    o=finish(bpy.context.object,name,m); o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return o
def tube(name,pts,radius,m,cyclic=False):
    cv=bpy.data.curves.new(name,'CURVE'); cv.dimensions='3D'; cv.resolution_u=16
    cv.bevel_depth=radius; cv.bevel_resolution=4
    s=cv.splines.new('BEZIER'); s.bezier_points.add(len(pts)-1)
    for p,co in zip(s.bezier_points,pts): p.co=co; p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    s.use_cyclic_u=cyclic
    o=bpy.data.objects.new(name,cv); asset.objects.link(o); cv.materials.append(m)
    return o
def segment(name,a,b,width,depth,m):
    v=Vector(b)-Vector(a)
    o=ell(name,(Vector(a)+Vector(b))/2,(width,depth,v.length/2+width*.35),m)
    o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
    return o
def mesh(name,verts,faces,m,sub=0):
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update()
    o=bpy.data.objects.new(name,me); asset.objects.link(o); me.materials.append(m)
    for p in me.polygons:p.use_smooth=True
    if sub:
        mod=o.modifiers.new('Suavizado editable','SUBSURF'); mod.levels=sub; mod.render_levels=sub
    return o
def loft(name,levels,m,sub=2):
    n=48; verts=[]
    for z,rx,ry,yc in levels:
        for j in range(n):
            a=2*math.pi*j/n; verts.append((rx*math.cos(a),yc+ry*math.sin(a),z))
    faces=[tuple(reversed(range(n)))]
    for k in range(len(levels)-1):
        for j in range(n):
            a=k*n+j;b=k*n+(j+1)%n;faces.append((a,b,b+n,a+n))
    faces.append(tuple((len(levels)-1)*n+j for j in range(n)))
    return mesh(name,verts,faces,m,sub)

# Body follows the frontal silhouette, with short legs and an oversized head.
ell('Cuerpo bajo sudadera',(0,.02,1.13),(.88,.48,.64),white)
for sign,label in [(-1,'R'),(1,'L')]:
    ell('Pierna.'+label,(sign*.48,.025,.56),(.38,.37,.5),white)
    ell('Pie.'+label,(sign*.51,-.18,.205),(.46,.55,.205),white)
    for j in range(3):
        ell('Dedo_pie_%d.%s'%(j,label),(sign*.51+(j-1)*.205,-.57,.18),(.155,.22,.165),white,24,16)
loft('Sudadera torso',[(.84,.73,.39,0),(.88,.88,.48,0),(1.05,.96,.51,0),(1.55,.94,.52,0),(2.05,.83,.45,0),(2.29,.63,.35,0),(2.32,.5,.3,0)],dark)
loft('Cintura tejida',[(.81,.77,.4,0),(.83,.9,.48,0),(.92,.925,.5,0),(1.0,.9,.485,0)],rib,1)
for sign,label in [(-1,'R'),(1,'L')]:
    segment('Manga.'+label,(sign*.76,0,2.04),(sign*1.29,-.04,1.29),.34,.355,dark)
    cuff=ell('Puno.'+label,(sign*1.3,-.055,1.22),(.325,.33,.145),rib)
    cuff.rotation_euler[1]=sign*.4
    hand=ell('Mano.'+label,(sign*1.34,-.075,1.00),(.295,.285,.29),white)
    ell('Pulgar.'+label,(sign*1.15,-.27,1.02),(.14,.14,.18),white,28,18)
    # Visible backpack straps.
    tube('Correa.'+label,[(sign*.68,.24,2.36),(sign*.81,-.26,2.2),(sign*.78,-.44,1.96),(sign*.79,-.48,1.69),(sign*.84,-.36,1.51)],.096,strap)
    tube('Costura_correa.'+label,[(sign*.755,-.32,2.2),(sign*.725,-.49,1.97),(sign*.74,-.54,1.7)],.012,rib)
    buckle=ell('Hebilla_azul.'+label,(sign*.79,-.565,1.69),(.095,.028,.045),cyan,24,16)
    tube('Borde_bolsillo.'+label,[(sign*.54,-.515,1.44),(sign*.61,-.535,1.3),(sign*.7,-.51,1.09)],.047,cyan)
    tube('Cordon.'+label,[(sign*.215,-.50,2.13),(sign*.224,-.57,1.94),(sign*.23,-.583,1.72)],.029,cyan)
    ell('Ojal.'+label,(sign*.215,-.508,2.13),(.055,.033,.055),blue,24,16)
    ell('Nudo.'+label,(sign*.23,-.585,1.72),(.057,.05,.06),cyan,24,16)
    ell('Punta_cordon.'+label,(sign*.23,-.585,1.656),(.032,.034,.04),blue,20,12)
tube('Costura central',[(0,-.477,2.07),(0,-.532,1.65),(0,-.546,1.2),(0,-.51,.91)],.009,rib)
tube('Bolsillo costura superior',[(-.56,-.518,1.45),(0,-.557,1.46),(.56,-.518,1.45)],.012,rib)

# Rounded backpack; posterior construction is an explicit design proposal.
pack=ell('Mochila posterior propuesta',(0,.49,1.59),(.73,.37,.73),strap)
ell('Mochila bolsillo posterior',(0,.78,1.41),(.55,.14,.4),dark)
tube('Mochila cierre azul',[(-.55,.76,1.42),(-.52,.78,1.73),(0,.81,1.87),(.52,.78,1.73),(.55,.76,1.42)],.018,blue)
tube('Mochila asa',[(-.17,.57,2.13),(-.13,.60,2.38),(.13,.60,2.38),(.17,.57,2.13)],.045,rib)

# Hood rim forms a soft V at the front, behind the chin.
hood=[]
for j in range(64):
    a=2*math.pi*j/64;x=.97*math.cos(a);y=.43*math.sin(a)
    z=2.37 + .09*max(0,math.sin(a))-.29*max(0,-math.sin(a))**6
    hood.append((x,y,z))
tube('Capucha acolchada',hood,.155,dark,True)
tube('Capucha borde azul',[(x,y-.026,z+.105) for x,y,z in hood],.052,cyan,True)

# Continuous head: pear-shaped cross sections retain broad low cheeks.
loft('Cabeza principal',[(2.34,.18,.2,0),(2.38,.57,.44,0),(2.51,1.0,.65,0),(2.73,1.18,.77,0),(3.00,1.23,.82,0),(3.35,1.15,.8,0),(3.69,.98,.7,0),(3.94,.74,.55,0),(4.1,.42,.33,0),(4.16,.06,.055,0)],white,2)
for sign,label in [(-1,'R'),(1,'L')]:
    ell('Oreja exterior.'+label,(sign*1.02,.045,3.91),(.50,.235,.53),white)
    ell('Oreja interior azul.'+label,(sign*1.025,-.17,3.91),(.273,.071,.303),blue)
    # Oval eye layers, with the pupil offset up to leave a lower blue iris crescent.
    ell('Ojo blanco.'+label,(sign*.48,-.763,3.16),(.208,.142,.252),eyewhite)
    ell('Iris.'+label,(sign*.48,-.877,3.153),(.164,.069,.208),blue)
    ell('Pupila.'+label,(sign*.48,-.924,3.186),(.145,.045,.179),black)
    ell('Brillo principal.'+label,(sign*.48+.054,-.961,3.278),(.042,.018,.045),eyewhite,24,16)
    ell('Brillo secundario.'+label,(sign*.48-.068,-.947,3.18),(.016,.012,.019),eyewhite,20,12)
    tube('Ceja.'+label,[(sign*.34,-.693,3.608),(sign*.43,-.714,3.629),(sign*.55,-.681,3.574)],.035,black)

# Open smile with blue tongue, separate muzzle lobes and a small triangular nose.
ell('Sonrisa abierta',(0,-.816,2.804),(.268,.101,.229),mouthmat)
for sign in [-1,1]:
    ell('Lengua azul '+str(sign),(sign*.061,-.91,2.72),(.09,.026,.095),blue,28,18)
    ell('Hocico '+str(sign),(sign*.12,-.868,2.977),(.161,.126,.104),white)
nose=ell('Nariz',(0,-1.0,3.055),(.143,.095,.086),black)
for v in nose.data.vertices:
    if v.co.z<0:v.co.x*=.55+.45*(v.co.z/.086+1)
tube('Filtrum',[(0,-.985,3.004),(0,-.979,2.945)],.012,black)
# Two tapered curved tufts rather than detached spheres.
def tuft(name,centers,radii):
    verts=[];n=24
    for (x,y,z),r in zip(centers,radii):
        for j in range(n):
            a=2*math.pi*j/n;verts.append((x+r*math.cos(a),y+r*.65*math.sin(a),z))
    faces=[]
    for k in range(len(centers)-1):
        for j in range(n):faces.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
    faces.extend([tuple(reversed(range(n))),tuple((len(centers)-1)*n+j for j in range(n))])
    return mesh(name,verts,faces,white,2)
tuft('Mechon mayor',[(-.18,0,4.06),(-.09,0,4.16),(.015,0,4.28),(.08,0,4.43)],[.24,.20,.13,.009])
tuft('Mechon menor',[(.09,-.025,4.075),(.16,-.035,4.17),(.20,-.035,4.3)],[.17,.115,.005])

# Approximate small embroidered chest mark from the visible reference.
def badge_poly(name,points,m):
    o=mesh(name,[(x,-.513,z) for x,z in points],[tuple(range(len(points)))],m)
    sol=o.modifiers.new('Bordado grosor','SOLIDIFY');sol.thickness=.012
    be=o.modifiers.new('Bordado bordes','BEVEL');be.width=.014;be.segments=3
badge_poly('Marca pecho trazo blanco',[(.335,1.57),(.335,1.8),(.515,1.668),(.469,1.61),(.391,1.675),(.391,1.57)],eyewhite)
tube('Marca pecho corazon',[(.515,-.531,1.795),(.535,-.532,1.816),(.554,-.531,1.794),(.586,-.524,1.827)],.028,blue)
ell('Marca pecho punto',(.586,-.511,1.621),(.028,.015,.036),blue,24,16)

# Reference embedded in the .blend as a hidden, non-rendering image empty.
refcol=bpy.data.collections.new('REFERENCIA | Original sin modificar');scene.collection.children.link(refcol)
ref=bpy.data.objects.new('02_bazi_pose_base | referencia oficial',None);refcol.objects.link(ref)
ref.empty_display_type='IMAGE';ref.data=bpy.data.images.load(str(ROOT/'01_conceptos/02_bazi_pose_base.png'))
ref.data.pack();ref.empty_display_size=4.7;ref.location=(0,.95,2.24);ref.rotation_euler=(math.pi/2,0,0)
ref.color[3]=.35;ref.empty_image_depth='BACK';ref.hide_render=True;ref.hide_viewport=True

# Neutral studio for comparable views.
ground=mat('Fondo estudio','C7D0DD',.85)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));floor=move(bpy.context.object,studio);floor.name='Suelo estudio';floor.data.materials.append(ground)
world=bpy.data.worlds.new('Estudio neutro');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.32,.36,.45,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
def area(name,loc,power,size,color):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color
    o=bpy.data.objects.new(name,d);studio.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
area('Luz principal',(-4,-5,7),650,5,(1,.94,.89))
area('Relleno',(4,-3,4),400,4,(.78,.87,1))
area('Contraluz',(1,4,6),800,3,(.73,.85,1))
camdata=bpy.data.cameras.new('Camara revision');cam=bpy.data.objects.new('Camara revision',camdata);studio.objects.link(cam);scene.camera=cam
camdata.type='ORTHO';camdata.ortho_scale=5.15
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
def camera_view(loc,target=(0,0,2.22)):
    cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
camera_view((0,-10,2.22))
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type=='VIEW_3D':
            a.spaces.active.region_3d.view_distance=7
            a.spaces.active.region_3d.view_location=(0,0,2.2)
            a.spaces.active.region_3d.view_rotation=Quaternion((1,0,0),math.pi/2)
            a.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
head=bpy.data.objects['Cabeza principal'];head.select_set(True);bpy.context.view_layer.objects.active=head
scene['estado']='Prototipo visual. Sin rig, sin aprobacion de parecido, no integrado.'
scene['referencia']='01_conceptos/02_bazi_pose_base.png'
scene['inferencias']='Volumen lateral y parte posterior; logo bordado aproximado; sin pelo individual.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Bazi_v001.blend'))
# Prototype export for independent review only; no studio or original image included.
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects:o.select_set(True)
bpy.context.view_layer.objects.active=head
bpy.ops.export_scene.gltf(filepath=str(OUT/'Bazi_revision.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
stats={'blender':bpy.app.version_string,'objects':len(asset.objects),'status':'visual_prototype_unapproved','rig':False,'animations':False,'reference':'02_bazi_pose_base.png','inferred':['profile depth','backpack posterior','embroidered mark approximation'],'views':[]}
for name,loc in [('frontal',(0,-10,2.22)),('tres_cuartos',(6,-10,4.0)),('lateral',(10,0,2.22)),('posterior',(0,10,2.22))]:
    camera_view(loc);scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    stats['views'].append(name+'.png')
(OUT/'estado_modelo.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')
print('BAZI_COMPLETE',json.dumps(stats))
