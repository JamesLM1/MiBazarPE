import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { createBaziController } from './bazi-controller.js';
const $=id=>document.getElementById(id),stage=$('stage');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;stage.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,50);camera.position.set(0,2.45,10);camera.lookAt(0,2.18,0);
const group=new THREE.Group();scene.add(group);
scene.add(new THREE.HemisphereLight(0xe5f0ff,0x626d87,2.0));
function light(color,intensity,x,y,z){const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);return l;}
const key=light(0xfff8ef,3.7,-3,6,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=6;key.shadow.camera.bottom=-2;key.shadow.bias=-.0003;key.shadow.normalBias=.025;
light(0xbedbff,.75,4,3,3);light(0xa4c8ff,1.7,3,4,-3);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.ShadowMaterial({opacity:.22}));floor.rotation.x=-Math.PI/2;floor.position.y=.006;floor.receiveShadow=true;scene.add(floor);
const names={Idle:'Reposo',Saludando:'Saludar',Pensando:'Pensar',Preocupado:'Preocupación',Celebrando:'Celebrar',Email:'Señalar correo',Password:'Proteger contraseña',Talking:'Hablar',Walking:'Caminar',CoverEyes:'Cubrir ojos'};
let controller,model,paused=false,last=performance.now();
function choose(name,opts){if(!controller)return;controller.setGesture(name,opts);for(const b of $('gestures').children)b.classList.toggle('active',b.dataset.gesture===name);$('gesture-label').textContent=names[name];}
for(const [name,label] of Object.entries(names)){const b=document.createElement('button');b.textContent=label;b.dataset.gesture=name;b.onclick=()=>choose(name);$('gestures').appendChild(b);}
function resize(){renderer.setSize(stage.clientWidth,stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);
new GLTFLoader().load('./bazi.glb',gltf=>{
  model=gltf.scene;group.add(model);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  const mixer=new THREE.AnimationMixer(model);controller=createBaziController(THREE,mixer,gltf.animations,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});$('reduced').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('status').textContent=`GLB cargado · ${gltf.animations.length} acciones`;
  const requested=new URLSearchParams(location.search).get('gesture')||'Idle';choose(requested,{immediate:true});
  document.documentElement.dataset.loaded='true';
},undefined,error=>{$('status').textContent='No se pudo cargar el modelo';$('gesture-label').textContent=String(error.message||error);document.documentElement.dataset.loaded='error';});
$('pause').onclick=()=>{paused=!paused;controller?.setPaused(paused);$('pause').textContent=paused?'Continuar':'Pausar';};
$('repeat').onclick=()=>{paused=false;controller?.setPaused(false);$('pause').textContent='Pausar';choose(controller?.getState().gesture,{repeat:true});};
$('final').onclick=()=>{controller?.seek(1);paused=true;controller?.setPaused(true);$('pause').textContent='Continuar';$('seek').value=100;};
$('seek').oninput=()=>{paused=true;controller?.setPaused(true);$('pause').textContent='Continuar';controller?.seek(+$('seek').value/100);};
$('front').onclick=()=>group.rotation.y=0;$('quarter').onclick=()=>group.rotation.y=-.65;$('back').onclick=()=>group.rotation.y=Math.PI;
$('background').onclick=()=>$('stage').classList.toggle('light');$('reduced').onchange=()=>controller?.setReducedMotion($('reduced').checked);
$('email').onfocus=()=>choose('Email');$('password').onfocus=()=>choose($('cover').checked&&!$('visible').checked?'CoverEyes':'Password');
for(const id of ['email','password'])$(id).onblur=()=>setTimeout(()=>{if(!['email','password','visible','cover'].includes(document.activeElement.id))choose('Idle');},0);
function passwordState(){$('password').type=$('visible').checked?'text':'password';choose($('visible').checked?'Email':$('cover').checked?'CoverEyes':'Password');}
$('visible').onchange=passwordState;$('cover').onchange=passwordState;$('success').onclick=()=>choose('Celebrando');$('failure').onclick=()=>choose('Preocupado');
$('rapid').onclick=()=>{const seq=['Email','Password','Pensando','Saludando','Celebrando','Preocupado','Idle'];seq.forEach((name,i)=>setTimeout(()=>choose(name),i*150));};
function frame(now){const dt=(now-last)/1000;last=now;controller?.update(dt);if(controller){const st=controller.getState();$('progress').textContent=(st.transitioning?'Transición · ':'')+Math.round(st.time/st.duration*100)+'%';if(!paused)$('seek').value=Math.round(st.time/st.duration*100);}renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
