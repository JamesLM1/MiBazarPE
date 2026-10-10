(async function(){
  'use strict';
  const $=s=>document.querySelector(s),source=new Map([...document.querySelectorAll('#sources img')].map(i=>[i.dataset.pose,i]));
  const {actions,ConnectedMesh,deform}=BaziMotion;
  let mesh,state='welcome',duration=actions.welcome.duration,progress=0,paused=false,loop=true,speed=1,last=0,hold=0,raf=0,disposed=false,capture=null;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  function dimensions(){const r=$('#art').getBoundingClientRect(),side=Math.min(r.width,r.height);$('#square').style.width=side+'px';$('#square').style.height=side+'px';if(mesh)render();}
  function render(){
    const pose=actions[state].pose,img=source.get(pose),original=progress===0||progress===1;
    $('#exactPose').src=img.src;$('#exactPose').style.opacity=original?'1':'0';$('#motionCanvas').style.opacity=original?'0':'1';
    mesh.render(pose,state,progress);$('#progress').value=Math.round(progress*100);$('#frameLabel').textContent=Math.round(progress*100)+'%';
    if(capture){capture.ctx.fillStyle='#18253a';capture.ctx.fillRect(0,0,512,512);capture.ctx.drawImage($('#motionCanvas'),0,0,512,512);}
    $('#stage').dataset.action=state;$('#stage').dataset.progress=progress.toFixed(5);$('#stage').dataset.paused=String(paused);$('#stage').dataset.source=img.dataset.name;
    $('#stage').dataset.motionSample=deform(255,820,state,progress).map(x=>x.toFixed(3)).join(',');
  }
  function announce(){const text=reduce.matches?'Movimiento reducido · pose final':progress===1?'Boceto original · pose final':paused?'Acción en pausa':'Acción animada';$('#status').textContent=text;$('#pause').textContent=paused?'Continuar':'Pausar';$('#pause').setAttribute('aria-pressed',String(paused));}
  function select(name){
    if(!actions[name]||!mesh)return;
    state=name;duration=actions[name].duration;progress=reduce.matches?1:0;paused=reduce.matches;hold=0;last=0;
    const img=source.get(actions[state].pose);$('#actionLabel').textContent=actions[state].label;$('#sourceName').textContent=img.dataset.name;$('#referenceImage').src=img.src;$('#openOriginal').href=img.dataset.reference;
    document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===state)));render();announce();schedule();
  }
  function schedule(){if(!raf&&!paused&&!document.hidden&&!disposed)raf=requestAnimationFrame(tick);}
  function tick(now){
    raf=0;if(paused||document.hidden||disposed)return;
    const dt=last?Math.min(now-last,60):0;last=now;
    if(progress===1){hold+=dt;if(loop&&hold>650){progress=0;hold=0;announce();}else if(!loop){paused=true;announce();return;}}
    else{progress=Math.min(1,progress+dt*speed/duration);if(progress===1)announce();}
    render();schedule();
  }
  function stop(){paused=true;cancelAnimationFrame(raf);raf=0;last=0;announce();}
  try{
    await Promise.all([...source.values()].map(i=>i.decode()));mesh=new ConnectedMesh($('#motionCanvas'));for(const [key,img] of source)mesh.add(key,img);
    new ResizeObserver(dimensions).observe($('#art'));dimensions();select('welcome');
  }catch(e){$('#status').textContent=e.message;$('#exactPose').src=source.get('welcome').src;$('#motionCanvas').style.display='none';return;}
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>select(b.dataset.action));
  $('#pause').onclick=()=>{if(paused){if(progress===1)progress=0;paused=false;last=0;announce();schedule();}else stop();};
  $('#replay').onclick=()=>select(state);$('#finish').onclick=()=>{progress=1;hold=0;stop();render();};
  $('#record').onclick=()=>{
    if(typeof MediaRecorder==='undefined'){$('#status').textContent='Este navegador no permite guardar vídeo.';return;}
    const originalLoop=loop,action=state,canvas=document.createElement('canvas');canvas.width=canvas.height=512;
    const stream=canvas.captureStream(30),mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
    const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{}),chunks=[];
    const locked=[...document.querySelectorAll('button,input,select')];locked.forEach(el=>el.disabled=true);
    capture={ctx:canvas.getContext('2d')};loop=false;$('#loop').checked=false;$('#record').disabled=true;$('#record').textContent='Grabando…';
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Bazi_'+action+'_v004.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);stream.getTracks().forEach(t=>t.stop());capture=null;loop=originalLoop;$('#loop').checked=loop;locked.forEach(el=>el.disabled=false);$('#record').textContent='Guardar vídeo';progress=1;stop();render();};
    recorder.start();select(action);setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},duration/speed+900);
  };
  $('#progress').oninput=e=>{progress=Number(e.target.value)/100;hold=0;stop();render();};
  $('#loop').onchange=e=>loop=e.target.checked;$('#speed').onchange=e=>speed=Number(e.target.value);
  $('#background').onclick=()=>{const on=$('#stage').classList.toggle('light');$('#referenceBox').classList.toggle('light',on);$('#background').setAttribute('aria-pressed',String(on));};
  $('#email').onfocus=()=>select('email');$('#password').onfocus=()=>select($('#reveal').checked?'idle':'privacy');
  $('#password').oninput=()=>{if(!$('#reveal').checked&&state!=='privacy')select('privacy');};
  $('#reveal').onchange=e=>{$('#password').type=e.target.checked?'text':'password';select(e.target.checked?'idle':'privacy');};
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();});
  reduce.addEventListener('change',()=>{if(reduce.matches){progress=1;stop();render();}});
  window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);});
})();
