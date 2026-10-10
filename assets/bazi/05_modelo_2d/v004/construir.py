from pathlib import Path
import base64,hashlib,json
from PIL import Image
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1]
poses=[('idle','Reposo','01_conceptos/02_bazi_pose_base.png'),('welcome','Saludar','02_bocetos_funcionales/08_bazi_saludando.png'),('thinking','Pensar','02_bocetos_funcionales/04_bazi_pensativo.png'),('worried','Preocupación','02_bocetos_funcionales/05_bazi_preocupado.png'),('celebrate','Celebrar','02_bocetos_funcionales/06_bazi_celebrando.png'),('email','Señalar correo','02_bocetos_funcionales/09_bazi_senalando_email.png'),('privacy','Proteger contraseña','02_bocetos_funcionales/07_bazi_guardian_de_contrasenas.png')]
images=[];manifest=[]
for key,label,rel in poses:
    p=ROOT/rel;raw=p.read_bytes();sha=hashlib.sha256(raw).hexdigest();uri='data:image/png;base64,'+base64.b64encode(raw).decode()
    images.append(f'<img id="source-{key}" data-pose="{key}" data-name="{p.name}" data-reference="../../{rel}" src="{uri}" alt="Boceto original: {label}">')
    manifest.append(dict(pose=key,path=str(p),sha256=sha,size=list(Image.open(p).size)))
html=(OUT/'revision.template.html').read_text(encoding='utf-8').replace('<!--SOURCES-->',''.join(images))
html=html.replace('<button id="finish">Ver pose final</button>','<button id="finish">Ver pose final</button><button id="record">Guardar vídeo</button>')
(OUT/'revision.html').write_text(html,encoding='utf-8')
(OUT/'manifest.json').write_text(json.dumps(dict(version='v004',sources=manifest,method='connected textured mesh, with smooth local deformation; complete original overlay at action endpoints',source_edits=False,landing_integration=False,limitations=['small motion inside the authored pose; no anatomical interpolation between different drawings','2D surface deformation; no 3D rig, no new hidden geometry','walking uses base pose, speaking uses greeting pose; these actions have no dedicated reference','speaking mouth movement is rhythmic; no voice or audio synchronization']),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(built=True,poses=len(images),bytes=len(html.encode()))))
