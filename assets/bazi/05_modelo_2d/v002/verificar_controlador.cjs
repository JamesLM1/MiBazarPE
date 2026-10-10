// Functional checks for state interruption, pause timing and cleanup.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=__dirname,svgText=fs.readFileSync(path.join(root,'Bazi_2D_articulado.svg'),'utf8');
let now=1000,rafId=0;const frames=new Map(),listeners=new Map(),events=[];
class Node {constructor(id){this.id=id;this.attrs={};}setAttribute(k,v){this.attrs[k]=String(v);}}
const nodes=[...svgText.matchAll(/\bid="([^"]+)"/g)].map(m=>new Node(m[1]));
const svg={querySelectorAll:()=>nodes,dispatchEvent:e=>events.push(e)};
const context={window:{},performance:{now:()=>now},matchMedia:()=>({matches:false}),document:{hidden:false,addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:(k,v)=>{if(listeners.get(k)===v)listeners.delete(k);}},requestAnimationFrame:f=>{frames.set(++rafId,f);return rafId;},cancelAnimationFrame:id=>frames.delete(id),CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'bazi-controller.js'),'utf8'),context);
const b=new context.window.BaziPuppet(svg),node=id=>nodes.find(n=>n.id===id);
function tick(ms=16){now+=ms;const scheduled=[...frames.values()];frames.clear();for(const f of scheduled)f(now);}
function close(actual,expected){assert.ok(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`);}
const checks=[];function check(name,fn){fn();checks.push(name);}
check('Privacy and reveal reset eyes and hands',()=>{b.pause().coverEyes();assert.equal(node('eyeRBlink').attrs.opacity,'0');assert.equal(b.state,'privacy');b.coverEyes(false);assert.equal(b.current.eyeOpen,1);assert.equal(b.handPoses.L,'closed');});
check('Pause preserves speech timing after a long interruption',()=>{b.resume().speak('Una frase suficientemente larga para la prueba');tick(150);b.pause();const start=b.speech.start,paused=now;now+=20000;b.resume();close(b.speech.start-start,now-paused);assert.equal(b.state,'speaking');tick();assert.equal(b.state,'speaking');});
check('Changing state cancels an earlier speech sequence',()=>{b.setState('welcome');assert.equal(b.speech,null);assert.equal(b.handPoses.L,'open');});
check('Blink closes and restores the original eye',()=>{b.setState('idle').blink();tick(120);assert.equal(node('lidR').attrs.opacity,'1');tick(220);assert.equal(node('eyeRParts').attrs.opacity,'0');});
check('Selecting a new gesture while paused resumes from its start',()=>{b.pause();now+=5000;b.setState('walking');const newStart=b.start;now+=1000;b.resume();close(now-b.start,0);assert.ok(b.start>newStart);tick();assert.equal(b.state,'walking');});
check('Speech completion returns to idle and emits the visible-state event',()=>{b.speak('Hola');tick(2000);assert.equal(b.state,'idle');assert.equal(events.at(-1).detail.state,'idle');});
check('Independent hands, index, joints and face controls apply while paused',()=>{b.pause().setState('idle').setJoint('armL',-79).setHandPose('L','point').setFingerBend('L',28).setBrows(20,-20,3).setEyeOpen(0).setMouth(0).setGaze(8,5);assert.equal(node('handLPoint').attrs.opacity,'1');assert.match(node('fingerL').attrs.transform,/28/);assert.match(node('armL').attrs.transform,/-79/);assert.equal(node('closedMouth').attrs.opacity,'1');assert.equal(node('lidR').attrs.opacity,'1');});
check('Original comparison toggles the full original illustration',()=>{b.showOriginal(true);assert.equal(node('originalLayer').attrs.opacity,'1');assert.equal(node('puppet').attrs.opacity,'0');b.setState('idle');assert.equal(node('puppet').attrs.opacity,'1');});
check('Rapid gesture changes and walking keep every coordinate finite',()=>{b.resume();for(let i=0;i<400;i++){if(i%50===0)b.setState(['privacy','welcome','thinking','worried','celebrate','email','walking','idle'][i/50]);tick();for(const value of Object.values(b.current))assert.ok(Number.isFinite(value));}});
check('HTML controls and SVG have unique IDs',()=>{const html=fs.readFileSync(path.join(root,'revision.html'),'utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).filter(id=>!id.includes('${'));assert.equal(new Set(ids).size,ids.length);});
check('Disposal removes animation work and visibility listener',()=>{b.dispose();assert.equal(frames.size,0);assert.equal(listeners.size,0);});
fs.writeFileSync(path.join(root,'verificacion_controlador.json'),JSON.stringify({passed:checks.length,failed:0,checks},null,2));
console.log(JSON.stringify({passed:checks.length,failed:0}));
