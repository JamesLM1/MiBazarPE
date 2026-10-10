const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
let reduced=false,handler;const animations=[];
function image(state){return{dataset:{state},style:{opacity:'0'},attrs:{},setAttribute(k,v){this.attrs[k]=v;},animate(frames){let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;});const animation={finished,cancel(){reject(Object.assign(new Error('cancel'),{name:'AbortError'}));},resolve(){resolve();},frames};animations.push(animation);return animation;}};}
const images=['idle','welcome','thinking','worried','celebrate','email','privacy'].map(image),root={dataset:{},querySelectorAll:()=>images};
const document={hidden:false,addEventListener:(k,fn)=>handler=fn,removeEventListener:()=>handler=null};
const ctx={window:{},document,matchMedia:()=>({get matches(){return reduced;}}),getComputedStyle:img=>({opacity:img.style.opacity})};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'pose-controller.js'),'utf8'),ctx);
const player=new ctx.window.BaziPosePlayer(root),checks=[];
const flush=()=>new Promise(setImmediate);
function visible(){return images.filter(i=>Number(i.style.opacity)>0);}
function complete(state){assert.equal(root.dataset.phase,'settled');assert.equal(visible().length,1);assert.equal(visible()[0].dataset.state,state);assert.equal(visible()[0].style.opacity,'1');assert.equal(visible()[0].style.transform,'none');}
async function check(name,fn){await fn();checks.push(name);}
(async()=>{
 await check('All seven final poses show exactly one intact illustration',async()=>{for(const state of images.map(i=>i.dataset.state)){await player.setState(state,{immediate:true});complete(state);}});
 await check('Transition exits before the next pose enters',async()=>{player.finish();const move=player.setState('thinking');assert.equal(root.dataset.phase,'transition');assert.equal(visible().length,1);animations.at(-1).resolve();await flush();assert.equal(visible().length,0);assert.equal(player.visible,'thinking');animations.at(-1).resolve();await move;complete('thinking');});
 await check('Rapid changes finish on the most recent requested reference',async()=>{const a=player.setState('welcome'),b=player.setState('worried'),c=player.setState('celebrate');animations.at(-1).resolve();await flush();animations.at(-1).resolve();await Promise.all([a,b,c]);complete('celebrate');});
 await check('Finishing cancels pending motion without stale pose callbacks',async()=>{const pending=player.setState('email');player.finish();await pending;complete('email');});
 await check('Reduced motion uses complete poses immediately',async()=>{reduced=true;await player.setState('privacy');complete('privacy');reduced=false;});
 await check('Hiding the document settles a pending transition',async()=>{const pending=player.setState('idle');document.hidden=true;handler();await pending;complete('idle');document.hidden=false;});
 await check('Controller rejects poses without a reference drawing',async()=>{await assert.rejects(player.setState('walking'),/No original reference/);});
 await check('Disposal cancels work and removes its document listener',async()=>{const pending=player.setState('welcome');player.dispose();await pending;assert.equal(handler,null);assert.equal(player.listeners.size,0);});
 fs.writeFileSync(path.join(__dirname,'verificacion_controlador.json'),JSON.stringify({passed:checks.length,failed:0,checks},null,2));console.log(JSON.stringify({passed:checks.length,failed:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
