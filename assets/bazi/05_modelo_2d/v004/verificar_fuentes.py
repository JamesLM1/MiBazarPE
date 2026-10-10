from pathlib import Path
import re,base64,json,hashlib
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1]
html=(OUT/'revision.html').read_text(encoding='utf-8');manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
records=[]
for row in manifest['sources']:
    found=re.search(r'<img id="source-'+row['pose']+r'"[^>]*src="data:image/png;base64,([^"]+)"',html)
    embedded=base64.b64decode(found.group(1));original=Path(row['path']).read_bytes()
    assert embedded==original,row['pose']
    records.append(dict(pose=row['pose'],bytes_identical=True,sha256=hashlib.sha256(original).hexdigest()))
baseline=json.loads((ROOT/'04_modelo_3d/iteraciones/v001/originales_sha256.json').read_text(encoding='utf-8-sig'))
originals=[]
for row in baseline:
    unchanged=hashlib.sha256(Path(row['path']).read_bytes()).hexdigest().upper()==row['sha256'].upper()
    assert unchanged,row['path'];originals.append(dict(path=row['path'],unchanged=unchanged))
result=dict(embedded_poses_verified=len(records),originals_checked=len(originals),originals_changed=0,poses=records,originals=originals)
(OUT/'verificacion_fuentes.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:result[k] for k in ['embedded_poses_verified','originals_checked','originals_changed']}))
