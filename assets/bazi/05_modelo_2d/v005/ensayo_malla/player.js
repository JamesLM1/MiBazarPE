(async function(){
 'use strict';
 const $=s=>document.querySelector(s),source=new Map([...document.querySelectorAll('#sources img')].map(i=>[i.dataset.pose,i]));
 const {actions,ConnectedMesh,deform}=BaziMotion,{PoseTransition,anchors,names}=BaziTransition;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let mesh,bridge,state='idle',progress=1,paused=true,loop=true,speed=1,last=0,hold=0,raf=0,disposed=false,change=null,lastChange=null,changeProgress=1,phase='action',currentPoints=anchors.idle,snapshotCounter=0,capture=null,demo=null;
 const CHANGE_DURATION=950;
 function dimensions(){const r=$('#art').getBoundingClientRect(),side=Math.min(r.width,r.height);$('#square').style.width=side+'px';$('#square').style.height=side+'px';if(mesh)render();}
 function visibleCanvas(){return phase==='transition'?$('#transitionCanvas'):$('#motionCanvas');}
 function render(){
   const pose=actions[state].pose,img=source.get(pose),isTransition=phase==='transition',exact=!isTransition&&(progress===0||progress===1);
   $('#exactPose').src=img.src;$('#exactPose').style.opacity=exact?'1':'0';$('#motionCanvas').style.opacity=!isTransition&&!exact?'1':'0';$('#transitionCanvas').style.opacity=isTransition?'1':'0';
   if(isTransition)currentPoints=bridge.render(change.fromKey,pose,changeProgress,change.fromPoints,anchors[pose]);
   else{mesh.render(pose,state,progress);currentPoints=Object.fromEntries(names.map(n=>[n,deform(...anchors[pose][n],state,progress)]));}
   if(capture){capture.ctx.fillStyle='#18253a';capture.ctx.fillRect(0,0,512,512);capture.ctx.drawImage(exact?img:visibleCanvas(),0,0,512,512);}
   $('#progress').value=Math.round(progress*100);$('#frameLabel').textContent=(isTransition?'Cambio ':'Acción ')+Math.round((isTransition?changeProgress:progress)*100)+'%';
   $('#transitionProgress').value=Math.round(changeProgress*100);$('#transitionName').textContent=lastChange?lastChange.fromLabel+' → '+actions[state].label:'Reposo';
   Object.assign($('#stage').dataset,{action:state,progress:progress.toFixed(5),transitionProgress:changeProgress.toFixed(5),phase,paused:String(paused),source:img.dataset.name,transitionFrom:lastChange?.fromAction||'idle',paw:currentPoints.pawR.map(n=>n.toFixed(3)).join(',')});
 }
 function announce(){
   $('#status').textContent=reduce.matches?'Movimiento reducido · boceto original':phase==='transition'?(paused?'Cambio en pausa':'Moviéndose hacia '+actions[state].label):progress===1?'Boceto original · pose final':paused?'Acción en pausa':'Acción animada';
   $('#pause').textContent=paused?'Continuar':'Pausar';$('#pause').setAttribute('aria-pressed',String(paused));
 }
 function schedule(){if(!raf&&!paused&&!document.hidden&&!disposed)raf=requestAnimationFrame(tick);}
 function snapshot(){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1254;const ctx=canvas.getContext('2d');
   const exact=phase!=='transition'&&(progress===0||progress===1);ctx.drawImage(exact?source.get(actions[state].pose):visibleCanvas(),0,0,1254,1254);
   const key='snapshot'+(++snapshotCounter%2);bridge.add(key,canvas);return key;
 }
 function metadata(){const img=source.get(actions[state].pose);$('#actionLabel').textContent=actions[state].label;$('#sourceName').textContent=img.dataset.name;$('#referenceImage').src=img.src;$('#openOriginal').href=img.dataset.reference;document.querySelectorAll('button[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===state)));}
 function select(name,{automatic=false,replay=false}={}){
   if(!actions[name]||!mesh)return;if(!automatic)demo=null;
   if(name===state&&!replay){if(paused){paused=false;last=0;announce();schedule();}return;}
   const fromAction=state,fromLabel=actions[state].label,fromKey=snapshot(),fromPoints=Object.fromEntries(names.map(n=>[n,currentPoints[n].slice()]));
   state=name;progress=0;hold=0;last=0;paused=reduce.matches;changeProgress=reduce.matches?1:0;phase=reduce.matches?'action':'transition';
   change={fromKey,fromPoints,fromAction,fromLabel};lastChange=change;metadata();render();announce();schedule();
   $('#stage').dispatchEvent(new CustomEvent('bazi:gesturechange',{detail:{from:fromAction,to:name}}));
 }
 function tick(now){
   raf=0;if(paused||document.hidden||disposed)return;const dt=last?Math.min(now-last,70):0;last=now;
   if(phase==='transition'){
     changeProgress=Math.min(1,changeProgress+dt*speed/CHANGE_DURATION);
     if(changeProgress===1){phase='action';progress=reduce.matches?1:0;announce();}
   }else if(progress===1){
     hold+=dt;
     if(demo&&hold>450){const next=demo.shift();if(next){select(next,{automatic:true});return;}demo=null;paused=true;announce();return;}
     if(!demo&&loop&&hold>650){progress=0;hold=0;announce();}else if(!loop&&!demo){paused=true;announce();render();return;}
   }else{progress=Math.min(1,progress+dt*speed/actions[state].duration);if(progress===1)announce();}
   render();schedule();
 }
 function stop(){paused=true;cancelAnimationFrame(raf);raf=0;last=0;announce();}
 function replayChange(){if(!lastChange)return;demo=null;change=lastChange;changeProgress=0;progress=0;phase='transition';paused=false;last=0;hold=0;render();announce();schedule();}
 try{
   await Promise.all([...source.values()].map(i=>i.decode()));mesh=new ConnectedMesh($('#motionCanvas'));bridge=new PoseTransition($('#transitionCanvas'));for(const [key,img] of source){mesh.add(key,img);bridge.add(key,img);}
   new ResizeObserver(dimensions).observe($('#art'));metadata();dimensions();select('welcome');
 }catch(e){$('#status').textContent=e.message;$('#exactPose').src=source.get('idle').src;return;}
 document.querySelectorAll('button[data-action]').forEach(b=>b.onclick=()=>select(b.dataset.action));
 $('#pause').onclick=()=>{if(paused){if(phase==='action'&&progress===1)progress=0;paused=false;last=0;announce();schedule();}else stop();};
 $('#replay').onclick=()=>{demo=null;phase='action';progress=0;hold=0;last=0;paused=reduce.matches;render();announce();schedule();};
 $('#replayChange').onclick=replayChange;
 $('#finish').onclick=()=>{demo=null;phase='action';changeProgress=1;progress=1;hold=0;stop();render();};
 $('#transitionProgress').oninput=e=>{if(!lastChange)return;demo=null;change=lastChange;changeProgress=Number(e.target.value)/100;phase=changeProgress===1?'action':'transition';progress=0;hold=0;stop();render();};
 $('#progress').oninput=e=>{demo=null;phase='action';changeProgress=1;progress=Number(e.target.value)/100;hold=0;stop();render();};
 $('#loop').onchange=e=>loop=e.target.checked;$('#speed').onchange=e=>speed=Number(e.target.value);
 $('#background').onclick=()=>{const on=$('#stage').classList.toggle('light');$('#referenceBox').classList.toggle('light',on);$('#background').setAttribute('aria-pressed',String(on));};
 $('#email').onfocus=()=>select('email');$('#password').onfocus=()=>select($('#reveal').checked?'idle':'privacy');
 $('#password').oninput=()=>{if(!$('#reveal').checked&&state!=='privacy')select('privacy');};
 $('#reveal').onchange=e=>{$('#password').type=e.target.checked?'text':'password';select(e.target.checked?'idle':'privacy');};
 $('#demo').onclick=()=>{demo=['email','privacy','idle','worried','thinking','celebrate','walking','speaking','idle'];select('welcome',{automatic:true,replay:true});};
 $('#record').onclick=()=>{
   if(typeof MediaRecorder==='undefined'){$('#status').textContent='Este navegador no permite guardar vídeo.';return;}
   const originalLoop=loop,action=state,canvas=document.createElement('canvas');canvas.width=canvas.height=512;
   const stream=canvas.captureStream(30),mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x)),recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{}),chunks=[];
   const locked=[...document.querySelectorAll('button,input,select')];locked.forEach(el=>el.disabled=true);capture={ctx:canvas.getContext('2d')};demo=null;loop=false;$('#record').textContent='Grabando…';
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Bazi_cambio_'+action+'_v005.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);stream.getTracks().forEach(t=>t.stop());capture=null;loop=originalLoop;locked.forEach(el=>el.disabled=false);$('#record').textContent='Guardar vídeo';phase='action';progress=1;changeProgress=1;stop();render();};
   recorder.start();if(lastChange)replayChange();else select(action,{replay:true});setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},(CHANGE_DURATION+actions[state].duration)/speed+1000);
 };
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();});
 reduce.addEventListener('change',()=>{if(reduce.matches){phase='action';progress=1;changeProgress=1;demo=null;stop();render();}});
 window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);});
 // Framework-independent mounting surface. React can forward focus/reveal events here later.
 globalThis.BaziPlayer={setGesture:select,pause:stop,resume:()=>{paused=false;last=0;announce();schedule();},getState:()=>({gesture:state,phase,actionProgress:progress,transitionProgress:changeProgress,paused})};
})();
