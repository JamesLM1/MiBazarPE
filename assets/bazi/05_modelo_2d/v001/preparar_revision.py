"""Build a 2D animation review from unchanged source bytes; no bitmap regeneration."""
from pathlib import Path
import base64, json, hashlib
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
source=ROOT/'01_conceptos/02_bazi_pose_base.png'
data=source.read_bytes()
uri='data:image/png;base64,'+base64.b64encode(data).decode('ascii')
# These are runtime clipping regions, not newly painted artwork.
head='M 0 0 H 1254 V 440 H 935 C 938 487 914 526 870 550 C 810 582 707 602 627 607 C 532 603 424 581 369 553 C 329 532 310 500 306 440 H 0 Z'
armR='M 381 644 L 409 678 L 432 743 C 411 794 390 845 376 893 L 380 950 L 377 1020 H 175 V 644 Z'
armL='M 873 644 L 845 678 L 822 743 C 843 794 864 845 878 893 L 874 950 L 877 1020 H 1079 V 644 Z'
defs=f'''<defs>
<image id="baziArtwork" width="1254" height="1254" href="{uri}"/>
<clipPath id="headClip"><path d="{head}"/></clipPath>
<clipPath id="armRClip"><path d="{armR}"/></clipPath>
<clipPath id="armLClip"><path d="{armL}"/></clipPath>
<mask id="bodyMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254"><rect width="1254" height="1254" fill="white"/><path d="{head}" fill="black"/><path d="{armR}" fill="black"/><path d="{armL}" fill="black"/></mask>
</defs>'''
groups='''<g id="baziBody"><use href="#baziArtwork" mask="url(#bodyMask)"/></g>
<g id="baziArmR" style="transform-origin:395px 700px"><use href="#baziArtwork" clip-path="url(#armRClip)"/></g>
<g id="baziArmL" style="transform-origin:859px 700px"><use href="#baziArtwork" clip-path="url(#armLClip)"/></g>
<g id="baziHead" style="transform-origin:627px 566px"><use href="#baziArtwork" clip-path="url(#headClip)"/></g>'''
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" role="img" aria-label="Bazi original separado en cabeza, torso y brazos para movimiento 2D">{defs}{groups}</svg>'
(OUT/'Bazi_2D_capas.svg').write_text(svg,encoding='utf-8')
template=(OUT/'revision.template.html').read_text(encoding='utf-8')
(OUT/'revision.html').write_text(template.replace('<!--BAZI_SVG-->',svg),encoding='utf-8')
poses=[('reposo','01_conceptos/02_bazi_pose_base.png'),('pensando','02_bocetos_funcionales/04_bazi_pensativo.png'),('preocupado','02_bocetos_funcionales/05_bazi_preocupado.png'),('celebrando','02_bocetos_funcionales/06_bazi_celebrando.png'),('privacidad','02_bocetos_funcionales/07_bazi_guardian_de_contrasenas.png'),('ayuda','02_bocetos_funcionales/08_bazi_saludando.png'),('email','02_bocetos_funcionales/09_bazi_senalando_email.png')]
manifest={'version':'2d-v001','status':'visual_review_partial_articulation','primary_source':str(source),'sha256':hashlib.sha256(data).hexdigest(),'source_pixels':'embedded unchanged; no regeneration','parts':{'head':{'pivot':[627,566],'rotation_degrees':[-3,3]},'armR':{'pivot':[395,700],'rotation_degrees':[-6,6]},'armL':{'pivot':[859,700],'rotation_degrees':[-6,6]},'body':{'rotation_degrees':[0,0]}},'poses':[{'state':s,'path':p,'sha256':hashlib.sha256((ROOT/p).read_bytes()).hexdigest()} for s,p in poses],'not_implemented':['independent eye gaze','blink','lip sync','articulated fingers','full arm raise','continuous interpolation between illustrated poses','360 degree rotation'],'requires_next':['complete occluded areas on separate layers','independent face layers','approved closed eyelids and mouth shapes','production rig and deformation tests'],'integration':False}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'source_unchanged':hashlib.sha256(source.read_bytes()).hexdigest()==manifest['sha256'],'files':['Bazi_2D_capas.svg','revision.html','manifest.json']}))
