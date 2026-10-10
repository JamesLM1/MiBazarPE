"""Assemble unchanged original artwork and generated hidden plates into a 2D puppet.
No source bitmap is overwritten or painted by this script. SVG masks act at runtime.
"""
from pathlib import Path
import base64,json,hashlib
from PIL import Image

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[1]
sources={'original':ROOT/'01_conceptos/02_bazi_pose_base.png','cleanFace':OUT/'apoyos/rostro_limpio.png','cleanTorso':OUT/'apoyos/torso_sin_brazos.png','openHandSource':ROOT/'02_bocetos_funcionales/06_bazi_celebrando.png','pointHandSource':ROOT/'02_bocetos_funcionales/09_bazi_senalando_email.png'}
images=[];records=[]
for name,p in sources.items():
    raw=p.read_bytes();w,h=Image.open(p).size
    images.append(f'<image id="{name}" width="1254" height="1254" href="data:image/png;base64,{base64.b64encode(raw).decode()}"/>')
    records.append({'id':name,'path':str(p),'sha256':hashlib.sha256(raw).hexdigest(),'size':[w,h],'origin':'original' if name in ['original','openHandSource','pointHandSource'] else 'built_in_imagegen_hidden_reconstruction'})
head='M0 0 H1254 V440 H935 C938 487 914 526 870 550 C810 582 707 602 627 607 C532 603 424 581 369 553 C329 532 310 500 306 440 H0Z'
armR='M362 644 L379 670 L382 706 L372 752 L367 787 L386 831 L375 893 L367 924 L356 962 L345 1015 H175 V644Z'
armL='M892 644 L875 670 L872 706 L882 752 L887 787 L868 831 L879 893 L887 924 L898 962 L909 1015 H1079 V644Z'
handR='M225 869 H365 L373 919 L365 951 L356 979 L336 1006 L320 1014 H245 L213 975 L211 923Z'
handL='M1029 869 H889 L881 919 L889 951 L898 979 L918 1006 L934 1014 H1009 L1041 975 L1043 923Z'
legR='M385 995 H627 V1090 L605 1150 L600 1214 H345 V1125 L390 1096Z';legL='M869 995 H627 V1090 L649 1150 L654 1214 H909 V1125 L864 1096Z'
eyeR='M502 346 C474 347 452 369 453 404 C451 433 469 451 499 453 C533 453 551 434 550 402 C549 369 529 347 502 346Z'
eyeL='M750 345 C721 346 703 369 702 403 C701 434 719 451 748 453 C780 452 801 431 800 402 C798 367 777 346 750 345Z'
mouth='M552 465 C576 482 601 482 627 470 C651 481 675 482 700 464 C692 507 669 546 628 547 C588 547 563 511 552 465Z'
openHand='M192 395 C237 386 281 413 306 448 C314 473 306 507 286 541 C268 566 245 582 224 583 C186 579 149 556 134 525 C117 492 124 454 143 433 C156 415 175 401 192 395Z'
pointHand='M797 609 C793 591 823 571 848 549 C870 530 892 522 906 540 C920 559 899 578 876 593 L861 611 C888 616 901 639 890 661 C879 688 853 700 826 686 C796 678 771 658 775 635Z'
finger='M814 582 C832 566 855 543 876 531 C890 523 906 537 908 550 C910 562 893 578 875 593 L854 612 L829 603Z'
def clip(name,path):return f'<clipPath id="{name}" clipPathUnits="userSpaceOnUse"><path d="{path}"/></clipPath>'
def mask(name,white,black=''):
    return f'<mask id="{name}" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">{white}{black}</mask>'
basewhite='<rect width="1254" height="1254" fill="white"/>'
defs=''.join(images)+''.join([clip('headClip',head),clip('armRClip',armR),clip('armLClip',armL),clip('legRClip',legR),clip('legLClip',legL),clip('eyeRClip',eyeR),clip('eyeLClip',eyeL),clip('mouthClip',mouth),clip('openHandClip',openHand),clip('pointHandClip',pointHand),clip('fingerClip',finger)])
defs+='''<filter id="feather" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
<linearGradient id="eyeWhite" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f1f0f2"/><stop offset=".6" stop-color="white"/><stop offset="1" stop-color="#aeb5c4"/></linearGradient>
<linearGradient id="lidGloss" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#24242b"/><stop offset="1" stop-color="#050609"/></linearGradient>
'''+clip('handRClip',handR)+clip('handLClip',handL)+'''
<clipPath id="muzzleClip"><path d="M627 445 C607 443 573 443 553 457 C544 465 547 474 560 479 C586 489 604 478 620 472 L627 463Z M627 445 C647 443 681 443 698 457 C707 465 704 474 694 479 C668 489 650 478 634 472 L627 463Z"/></clipPath>
<clipPath id="footRClip"><path d="M330 1104 H627 V1254 H330Z"/></clipPath>
<clipPath id="footLClip"><path d="M627 1104 H950 V1254 H627Z"/></clipPath>
<clipPath id="torsoFillClip"><path d="M385 614 C350 640 316 707 316 810 C310 867 340 925 385 1003 H869 C914 933 946 875 938 810 C938 723 903 654 869 614Z"/></clipPath>
<clipPath id="bodyOutlineClip"><path d="M320 514 L930 514 Q965 592 923 639 L870 678 L874 978 L873 1100 L905 1164 L890 1214 H350 L350 1165 L393 1097 L385 978 L385 670 Q292 604 320 514Z"/></clipPath>
<clipPath id="fingerRootClip"><ellipse cx="843" cy="605" rx="19" ry="16"/></clipPath>
<clipPath id="irisRClip"><ellipse cx="506" cy="400" rx="40" ry="49"/></clipPath>
<clipPath id="irisLClip"><ellipse cx="747" cy="400" rx="40" ry="49"/></clipPath>
<clipPath id="browRClip"><ellipse cx="503" cy="291" rx="36" ry="23"/></clipPath>
<clipPath id="browLClip"><ellipse cx="750" cy="291" rx="36" ry="23"/></clipPath>'''
defs+=mask('bodyMask',basewhite,''.join(f'<path d="{p}" fill="black"/>' for p in [head,armR,armL,legR,legL]))
for side,cx in [('R',299),('L',954)]:
    defs+=mask('sleeve'+side,basewhite,f'<rect x="{180 if side=="R" else 854}" y="869" width="220" height="160" fill="black"/>')
    defs+=mask('legNoFoot'+side,basewhite,f'<rect x="{330 if side=="R" else 627}" y="1104" width="{297 if side=="R" else 323}" height="150" fill="black"/>')
for name,cx,cy,rx,ry in [('skinEyeR',502,400,64,68),('skinEyeL',750,400,64,68),('skinBrowR',503,291,42,28),('skinBrowL',750,291,42,28),('skinMouth',627,510,91,60)]:
    defs+=mask(name,f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="white" filter="url(#feather)"/>')
defs+=mask('pointPalmMask',basewhite,f'<path d="{finger}" fill="black" stroke="black" stroke-width="12" stroke-linejoin="round"/>')
def hand(side):
    cx=299 if side=='R' else 954
    return f'''<g id="hand{side}">
    <g id="hand{side}Closed"><use href="#original" clip-path="url(#hand{side}Clip)"/></g>
    <g id="hand{side}Open" opacity="0" transform="translate({cx} 895) rotate(-150) scale(.72) translate(-273 -575)"><use href="#openHandSource" clip-path="url(#openHandClip)"/></g>
    <g id="hand{side}Point" opacity="0" transform="translate({cx} 895) rotate(126) scale(.83) translate(-785 -658)">
      <g clip-path="url(#pointHandClip)"><use href="#pointHandSource" mask="url(#pointPalmMask)"/></g>
      <g clip-path="url(#fingerRootClip)"><use href="#pointHandSource" transform="translate(0 -37)"/></g>
      <g id="finger{side}"><use href="#pointHandSource" clip-path="url(#fingerClip)"/></g>
    </g></g>'''
def eyes(side,path,cx):
    return f'''<g id="eye{side}Parts" opacity="0"><use href="#cleanFace" mask="url(#skinEye{side})"/>
    <g id="eye{side}Blink"><g clip-path="url(#eye{side}Clip)">
    <g id="eye{side}Reference"><use href="#original"/></g>
    <g id="eye{side}Gaze" opacity="0"><path d="{path}" fill="url(#eyeWhite)" stroke="#171920" stroke-width="3"/>
    <g id="pupil{side}"><use href="#original" clip-path="url(#iris{side}Clip)"/></g></g></g></g>
    <path id="lid{side}" d="M{cx-43} 409 Q{cx} 380 {cx+43} 409" fill="none" stroke="url(#lidGloss)" stroke-width="11" stroke-linecap="round" opacity="0"/>
    </g>'''
groups='''<g id="originalLayer" opacity="0"><use href="#original"/></g><g id="puppet">
<g id="torso"><use href="#cleanTorso" clip-path="url(#torsoFillClip)"/><use href="#original" mask="url(#bodyMask)" clip-path="url(#bodyOutlineClip)"/></g>'''
for side in ['R','L']:
    groups+=f'<g id="leg{side}"><g clip-path="url(#leg{side}Clip)"><use href="#original" mask="url(#legNoFoot{side})"/></g><g id="foot{side}"><use href="#original" clip-path="url(#foot{side}Clip)"/></g></g>'
groups+='''<g id="armsBehind"></g><g id="head"><use href="#original" clip-path="url(#headClip)"/>'''
groups+=eyes('R',eyeR,503)+eyes('L',eyeL,750)
for side in ['R','L']:
    groups+=f'<g id="brow{side}Parts" opacity="0"><use href="#cleanFace" mask="url(#skinBrow{side})"/><g id="brow{side}"><use href="#original" clip-path="url(#brow{side}Clip)"/></g></g>'
groups+='''<g id="mouthParts" opacity="0"><use href="#cleanFace" mask="url(#skinMouth)"/><g id="mouth"><use href="#original" clip-path="url(#mouthClip)"/></g><path id="closedMouth" d="M573 475 Q600 496 627 476 Q653 496 681 475" fill="none" stroke="#17171c" stroke-width="5" stroke-linecap="round" opacity="0"/><path id="sadMouth" d="M584 526 Q627 488 670 526" fill="none" stroke="#17171c" stroke-width="9" stroke-linecap="round" opacity="0"/><use href="#original" clip-path="url(#muzzleClip)"/></g></g><g id="armsFront">'''
for side in ['R','L']:
    groups+=f'<g id="arm{side}"><g clip-path="url(#arm{side}Clip)"><use href="#original" mask="url(#sleeve{side})"/></g>{hand(side)}</g>'
groups+='</g></g>'
svg=f'<svg id="baziSvg" xmlns="http://www.w3.org/2000/svg" viewBox="-140 -60 1534 1374" role="img" aria-label="Bazi 2D articulado con rostro, brazos, manos, piernas y pies"><defs>{defs}</defs>{groups}</svg>'
(OUT/'Bazi_2D_articulado.svg').write_text(svg,encoding='utf-8')
html=(OUT/'revision.template.html').read_text(encoding='utf-8')
# UI IDs must never collide with SVG joint IDs. Namespace controls before assembly.
for key in ['armR','armL','handR','handL','original']:
    html=html.replace(f'id="{key}"',f'id="control_{key}"').replace(f'for="{key}"',f'for="control_{key}"').replace(f"$('#{key}')",f"$('#control_{key}')")
html=html.replace("[['headAngle','head'],['armR','armR'],['armL','armL']]","[['headAngle','head'],['control_armR','armR'],['control_armL','armL']]")
html=html.replace("$('#'+field+'Value')","$('#'+field.replace('control_','')+'Value')")
html=html.replace("$('#hand'+side).onchange","$('#control_hand'+side).onchange")
html=html.replace('for="${key}"','for="control_${key}"').replace('id="${key}"','id="control_${key}"')
html=html.replace("$('#'+key).oninput","$('#control_'+key).oninput")
for key in ['browR','browL','browY']:
    html=html.replace(f"$('#{key}')",f"$('#control_{key}')")
html=html.replace("key.startsWith('brow')?'':'joint_'","key.startsWith('brow')?'control_':'joint_'")
html=html.replace("$('#'+prefix+key+'Value')","$('#'+(prefix==='control_'?'':prefix)+key+'Value')")
(OUT/'revision.html').write_text(html.replace('<!--PUPPET-->',svg),encoding='utf-8')
manifest={'version':'2d-v002','sources':records,'controller':'bazi-controller.js','states':['idle','welcome','thinking','worried','celebrate','email','privacy','walking','speaking'],'joints':{'head':[627,566],'armR':[395,670],'armL':[859,670],'handR':[299,895],'handL':[954,895],'legR':[494,998],'legL':[760,998],'footR':[483,1127],'footL':[769,1127]},'face':['pupils','eyelids','eyebrows','mouth'],'hands':['closed original','open from original celebration image','point from original email image','index bend on pointing hand'],'integration':False,'limitations':['frontal 2D artwork; no 360 degree volume','speech gesture uses text timing, not measured audio phonemes','open and pointing hands are transplanted original drawings, not separately rigged every digit','hidden fur and torso are generated reconstructions and require visual approval'],'neutral':'original artwork preserved; reconstructed support only where masking reveals it'}
manifest['limitations']+=['arms and legs are rigid sprites; no separate elbow or knee','SVG contains full-resolution embedded images and needs size optimization before product integration']
manifest['neutral']='Original source drawing retained; original comparison displays the complete unchanged PNG. Articulated rest pose also uses generated hidden support.'
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'built':True,'sources':len(records),'svg_bytes':len(svg.encode()),'html':'revision.html'}))
