from pathlib import Path
import re,base64,json,hashlib
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[1]
html=(OUT/'revision.html').read_text(encoding='utf-8')
manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
rows=[]
for pose in manifest['sources']:
    match=re.search(r'<img id="pose-'+pose['state']+r'"[^>]*src="data:image/png;base64,([^"]+)"',html)
    embedded=base64.b64decode(match.group(1));original=Path(pose['source']).read_bytes()
    assert embedded==original,pose['state']
    rows.append({'state':pose['state'],'bytes_identical':True,'sha256':hashlib.sha256(embedded).hexdigest()})
base=json.loads((ROOT/'04_modelo_3d/iteraciones/v001/originales_sha256.json').read_text(encoding='utf-8-sig'))
originals=[]
for row in base:
    same=hashlib.sha256(Path(row['path']).read_bytes()).hexdigest().upper()==row['sha256'].upper()
    assert same,row['path']
    originals.append(dict(path=row['path'],unchanged=same))
result={'embedded_poses_verified':len(rows),'originals_checked':len(originals),'originals_changed':0,'poses':rows,'originals':originals}
(OUT/'verificacion_fuentes.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:result[k] for k in ['embedded_poses_verified','originals_checked','originals_changed']}))
