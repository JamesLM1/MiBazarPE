"""Build a faithful pose review using complete unchanged reference PNG bytes."""
from pathlib import Path
import base64,hashlib,json
from PIL import Image
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[1]
poses=[('idle','Reposo','01_conceptos/02_bazi_pose_base.png'),('welcome','Saludar','02_bocetos_funcionales/08_bazi_saludando.png'),('thinking','Pensar','02_bocetos_funcionales/04_bazi_pensativo.png'),('worried','Preocupación','02_bocetos_funcionales/05_bazi_preocupado.png'),('celebrate','Celebrar','02_bocetos_funcionales/06_bazi_celebrando.png'),('email','Señalar correo','02_bocetos_funcionales/09_bazi_senalando_email.png'),('privacy','Proteger contraseña','02_bocetos_funcionales/07_bazi_guardian_de_contrasenas.png')]
sources=[];images=[];buttons=[]
for key,label,rel in poses:
    p=ROOT/rel;data=p.read_bytes();im=Image.open(p)
    sha=hashlib.sha256(data).hexdigest();uri='data:image/png;base64,'+base64.b64encode(data).decode()
    sources.append(dict(state=key,label=label,source=str(p),sha256=sha,size=list(im.size),complete_original=True))
    images.append(f'<img id="pose-{key}" class="pose" data-state="{key}" data-source="{p.name}" data-reference="../../{rel}" data-sha256="{sha}" src="{uri}" alt="Bazi: {label}, boceto original completo" draggable="false" style="opacity:{1 if key=="idle" else 0}" aria-hidden="{str(key!="idle").lower()}">')
    buttons.append(f'<button data-pose="{key}" aria-pressed="{str(key=="idle").lower()}">{label}</button>')
html=(OUT/'revision.template.html').read_text(encoding='utf-8').replace('<!--POSES-->',''.join(images)).replace('<!--BUTTONS-->',''.join(buttons))
html=html.replace("$('#openOriginal').href=img.src","$('#openOriginal').href=img.dataset.reference")
(OUT/'revision.html').write_text(html,encoding='utf-8')
manifest=dict(version='2d-v003-fiel',sources=sources,render='one complete original at a time; uniform contain; no cropping, mirroring, parts, reconstructed face or generated pixels',transition='sequential opacity 100 ms out + 180 ms in, no overlapping poses; reduced motion and rapid interruptions supported',scope='independent review only; no React or landing integration',limitations=['not a continuous skeletal animation','no authored walking, speech or eye-covering reference pose','original alpha edge imperfections retained; no retouching'])
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(built=True,poses=len(poses),bytes=len(html.encode('utf-8')))))
