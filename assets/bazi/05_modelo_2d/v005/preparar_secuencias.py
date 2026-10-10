"""Read sprite alpha to locate complete frames. Never modifies raster pixels."""
from pathlib import Path
from collections import deque
import json,hashlib
import numpy as np
from PIL import Image
out=Path(__file__).resolve().parent
spec={'welcome':4,'email':4,'privacy':4,'thinking':3,'worried':3,'celebrate':3}
records=[]
for pose,rows in spec.items():
    file=out/'transiciones'/f'{pose}.png';im=Image.open(file);a=np.array(im)[:,:,3];w,h=im.size;cw,ch=w/4,h/rows;frames=[]
    for row in range(rows):
        for col in range(4):
            # A small overlap accommodates nonuniform margins in generated sheets.
            x0=max(0,round(col*cw-10));y0=max(0,round(row*ch-10));x1=min(w,round((col+1)*cw+10));y1=min(h,round((row+1)*ch+20))
            mask=a[y0:y1,x0:x1]>128;visited=np.zeros_like(mask);parts=[]
            for py,px in np.argwhere(mask):
                if visited[py,px]:continue
                todo=deque([(int(px),int(py))]);visited[py,px]=True;points=[]
                while todo:
                    x,y=todo.popleft();points.append((x+x0,y+y0))
                    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]:
                        xx,yy=x+dx,y+dy
                        if 0<=yy<mask.shape[0] and 0<=xx<mask.shape[1] and mask[yy,xx] and not visited[yy,xx]:visited[yy,xx]=True;todo.append((xx,yy))
                if len(points)>150:
                    p=np.array(points);cx,cy=p.mean(0)
                    if col*cw<=cx<(col+1)*cw and row*ch<=cy<(row+1)*ch:parts.append(p)
            assert parts,(pose,row,col)
            body=max(parts,key=len);bx0,by0=body.min(0);bx1,by1=body.max(0)
            # Expanded tile lookup must not include a neighboring sprite's toes.
            props=[part for part in parts if part is not body and by0+ch*.10<part[:,1].mean()<by1-ch*.10]
            p=np.concatenate([body]+props);xx0,yy0=p.min(0);xx1,yy1=p.max(0)
            toes=body[body[:,1]>by1-9];root=float(toes[:,0].mean());rect=[int(xx0),int(yy0),int(xx1-xx0+1),int(yy1-yy0+1)]
            frames.append(dict(rect=rect,body=[int(bx0),int(by0),int(bx1),int(by1)],root_x=root,ground_y=int(by1),height=int(by1-by0+1),clipped_at_sheet_edge=bool(by1>=h-2),pixels=int(len(body))))
    # Omit any clipped bottom-row cell; raw original is always the final keyframe.
    usable=[i for i,f in enumerate(frames) if not f['clipped_at_sheet_edge']]
    records.append(dict(pose=pose,path=f'transiciones/{pose}.png',width=w,height=h,columns=4,rows=rows,frames=frames,usable=usable,sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
(out/'secuencias.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
bounds={}
for src in json.loads((out/'manifest.json').read_text(encoding='utf-8'))['sources']:
    xy=np.argwhere(np.array(Image.open(src['path']))[:,:,3]>128);lo=xy.min(0);hi=xy.max(0);bounds[src['pose']]=[int(lo[1]),int(lo[0]),int(hi[1]-lo[1]+1),int(hi[0]-lo[0]+1)]
(out/'secuencias.js').write_text('window.BaziSequences='+json.dumps(records,ensure_ascii=False)+';window.BaziOriginalBounds='+json.dumps(bounds)+';',encoding='utf-8')
print(json.dumps([dict(pose=r['pose'],frames=len(r['usable']),clipped_omitted=len(r['frames'])-len(r['usable'])) for r in records]))
