"""Load v001 into a separate process, refine materials and shapes, save only v002."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
OUT=Path(__file__).resolve().parent
if (OUT/'Bazi_v002.blend').exists(): raise RuntimeError('Version already exists.')
bpy.ops.wm.open_mainfile(filepath=str(OUT.parent/'v001/Bazi_v001.blend'),use_scripts=False)
scene=bpy.context.scene;asset=bpy.data.collections['BAZI | Prototipo visual v001']
asset.name='BAZI | Prototipo visual v002'
scene.view_settings.view_transform='Standard'
scene.view_settings.look='None'
scene.view_settings.exposure=-.5
blue=bpy.data.materials['Azul marca 0066FF'];cyan=bpy.data.materials['Azul ribete iluminado']
for m in [blue,cyan]:
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Specular IOR Level'].default_value=.18;bs.inputs['Roughness'].default_value=.56
    bs.inputs['Base Color'].default_value=(.001,.08 if m==blue else .27,1,1)
for m in [bpy.data.materials['Sudadera negra'],bpy.data.materials['Mochila y correas']]:
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Specular IOR Level'].default_value=.22
brows=bpy.data.materials['Pupilas nariz boca'].copy();brows.name='Cejas mate';brows.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
for side in ['L','R']:
    o=bpy.data.objects['Ceja.'+side];o.data.materials.clear();o.data.materials.append(brows)
    # Round off curve ends and remove sharp-looking highlights.
    points=o.data.splines[0].bezier_points
    points[0].radius=.65;points[-1].radius=.55
    eye=bpy.data.objects['Pupila.'+side];eye.scale.x=1.07;eye.scale.z=1.04
    # Compress each existing strap into a flat ribbon along the viewing-depth axis.
    o=bpy.data.objects['Correa.'+side]
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    # Convert the curve to mesh and flatten its cross-section around the centerline.
    oldpoints=[p.co.copy() for p in o.data.splines[0].bezier_points]
    bpy.ops.object.convert(target='MESH');o=bpy.context.object
    for v in o.data.vertices:
        nearest=min(oldpoints,key=lambda p:abs(p.z-v.co.z))
        # Interpolate centerline Y using adjacent control points in Z.
        for a,b in zip(oldpoints,oldpoints[1:]):
            if min(a.z,b.z)<=v.co.z<=max(a.z,b.z):
                t=(v.co.z-a.z)/(b.z-a.z);yc=a.y+t*(b.y-a.y);break
        else:yc=nearest.y
        v.co.y=yc+(v.co.y-yc)*.30
    for p in o.data.polygons:p.use_smooth=True
    buckle=bpy.data.objects['Hebilla_azul.'+side];buckle.scale.y=.65
    cuff=bpy.data.objects['Puno.'+side];cuff.scale.z=1.22
    thumb=bpy.data.objects['Pulgar.'+side];thumb.scale*=.76;thumb.location.y+=.035
    # A rounded ear rim and recessed center replace the flat disc impression.
    sign=1 if side=='L' else -1
    outer=bpy.data.objects['Oreja exterior.'+side];outer.location.y+=.12;outer.scale.y=.7
    inner=bpy.data.objects['Oreja interior azul.'+side];inner.location.y=.008;inner.scale.y=.8
    verts=[];faces=[];n=64;k=16
    for i in range(n):
        a=2*math.pi*i/n
        for j in range(k):
            b=2*math.pi*j/k
            r=.365+.139*math.cos(b)
            verts.append((sign*1.02+r*math.cos(a),-.026-.125*math.sin(b),3.91+1.06*r*math.sin(a)))
    for i in range(n):
        for j in range(k):faces.append((i*k+j,((i+1)%n)*k+j,((i+1)%n)*k+(j+1)%k,i*k+(j+1)%k))
    me=bpy.data.meshes.new('Oreja aro.'+side);me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new('Oreja aro.'+side,me);asset.objects.link(o);me.materials.append(bpy.data.materials['Pelaje blanco | microrelieve provisional'])
    for p in me.polygons:p.use_smooth=True
trim=bpy.data.objects['Capucha borde azul']
for s in trim.data.splines:
    for p in s.bezier_points:
        p.co.y-=.105;p.co.z-=.05
trim.data.bevel_depth=.049
# Smooth bevel sampling and rounded tube ends on hoodie details.
for o in asset.objects:
    if o.type=='CURVE':o.data.resolution_u=24;o.data.bevel_resolution=6
scene.cycles.samples=64
scene['estado']='Prototipo visual v002, pendiente de revision por James. Sin rig ni animaciones.'
bpy.ops.object.select_all(action='DESELECT');head=bpy.data.objects['Cabeza principal'];head.select_set(True);bpy.context.view_layer.objects.active=head
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Bazi_v002.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'Bazi_revision.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_extras=True)
cam=scene.camera
for name,loc in [('frontal',(0,-10,2.22)),('tres_cuartos',(6,-10,4.0)),('lateral',(10,0,2.22)),('posterior',(0,10,2.22))]:
    cam.location=loc;cam.rotation_euler=(Vector((0,0,2.22))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
(OUT/'estado_modelo.json').write_text(json.dumps({'version':'v002','estado':'prototipo_visual_pendiente_de_revision','blender':bpy.app.version_string,'rig':False,'animations':False,'objects':len(asset.objects),'inferred':['volumen lateral','mochila posterior','bordado aproximado'],'pending':['parecido aprobado por James','pelaje','retopologia','rig','expresiones','animaciones','optimizacion web'],'changes':['azul mas saturado','orejas con borde redondo','correas mas planas','ribete de capucha visible','cejas mate']},ensure_ascii=False,indent=2),encoding='utf-8')
print('BAZI_V002_COMPLETE')
