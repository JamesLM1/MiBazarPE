/* Bazi 2D controller. Standalone browser API; no React, network calls or dependencies. */
(function (global) {
  'use strict';
  const base = () => ({head:0,armR:0,armL:0,handR:0,handL:0,legR:0,legL:0,footR:0,footL:0,lookX:0,lookY:0,browR:0,browL:0,browY:0,mouthOpen:1,mouthWidth:1,eyeOpen:1,bounce:0,fingerR:0,fingerL:0});
  const states = {
    idle:{}, welcome:{head:-1,armR:-3,armL:-130,handL:0,browY:-3},
    thinking:{head:4,armR:-135,armL:4,lookX:5,lookY:-4,browR:-8,browL:7,mouthOpen:.09},
    worried:{head:-2,armR:-68,armL:68,handR:-10,handL:10,browR:27,browL:-27,browY:3,mouthOpen:0,eyeOpen:.9},
    celebrate:{head:0,armR:150,armL:-150,browY:-6,mouthOpen:1.08,eyeOpen:.04,legR:-3,legL:3},
    email:{head:-1,armR:0,armL:-79,lookX:7,lookY:1,mouthOpen:.7},
    privacy:{armR:-180,armL:180,handR:0,handL:0,eyeOpen:0,mouthOpen:.08},
    walking:{mouthOpen:.72}, speaking:{mouthOpen:.65,browY:-2}
  };
  const pivots={head:[627,566],armR:[395,670],armL:[859,670],handR:[299,895],handL:[954,895],legR:[494,998],legL:[760,998],footR:[483,1127],footL:[769,1127]};
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const angleDelta=(to,from)=>((to-from+540)%360)-180;
  class BaziPuppet {
    constructor(svg,options={}) {
      if(!svg)throw new Error('Bazi needs an SVG root.');
      this.svg=svg;this.nodes={};for(const el of svg.querySelectorAll('[id]'))this.nodes[el.id]=el;
      this.current=base();this.target=base();this.velocity=base();for(const k of Object.keys(this.velocity))this.velocity[k]=0;
      this.state='idle';this.handPoses={R:'closed',L:'closed'};this.userGaze=null;this.manualEye=null;this.manualMouth=null;this.userJoints={};
      this.autoBlink=true;this.breathe=true;this.paused=false;this.original=false;this.disposed=false;this.last=0;this.start=performance.now();this.nextBlink=this.start+3700;this.blinkStart=-Infinity;this.speech=null;
      this.reduce=matchMedia('(prefers-reduced-motion: reduce)');this._visibility=()=>{if(document.hidden)this._cancel();else if(!this.paused)this._schedule();};document.addEventListener('visibilitychange',this._visibility);
      this._tick=this._tick.bind(this);this._render();this._schedule();
    }
    _schedule(){if(!this.raf&&!this.disposed&&!this.paused&&!document.hidden)this.raf=requestAnimationFrame(this._tick);}
    _cancel(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
    setState(state){
      if(!(state in states))throw new Error('Unknown Bazi state: '+state);
      this.state=state;this.start=performance.now();this.speech=null;this.target={...base(),...states[state]};this.userJoints={};this.manualEye=null;this.manualMouth=null;this.userGaze=null;
      if(this.paused)this.pauseStart=this.start;
      this.handPoses={R:'closed',L:'closed'};
      if(state==='welcome')this.handPoses.L='open';
      if(state==='celebrate')this.handPoses={R:'open',L:'open'};
      if(state==='email')this.handPoses.L='point';
      for(const id in pivots)this.target[id]=this.current[id]+angleDelta(this.target[id],this.current[id]);
      this.showOriginal(false);if(this.paused||this.reduce.matches)this._settle();this._schedule();this.svg.dispatchEvent(new CustomEvent('bazi:state',{detail:{state}}));return this;
    }
    setGaze(x,y){this.userGaze={x:clamp(Number(x)||0,-8,8),y:clamp(Number(y)||0,-5,5)};if(this.paused)this._settle();return this;}
    resetGaze(){this.userGaze=null;return this;}
    blink(){this.blinkStart=performance.now();this._schedule();return this;}
    setEyeOpen(value){this.manualEye=clamp(Number(value),0,1);this._render();return this;}
    setMouth(open,width=1){this.manualMouth={open:clamp(Number(open),0,1.2),width:clamp(Number(width),.45,1.3)};if(this.paused)this._settle();return this;}
    setJoint(id,angle){if(!(id in pivots))throw new Error('Unknown joint: '+id);this.userJoints[id]=Number(angle)||0;if(this.paused)this._settle();return this;}
    setBrows(right,left,lift=0){Object.assign(this.userJoints,{browR:clamp(Number(right)||0,-35,35),browL:clamp(Number(left)||0,-35,35),browY:clamp(Number(lift)||0,-10,10)});if(this.paused)this._settle();return this;}
    setHandPose(side,pose){if(!['R','L'].includes(side)||!['closed','open','point'].includes(pose))throw new Error('Unknown hand pose');this.handPoses[side]=pose;this._render();return this;}
    setFingerBend(side,degrees){this.userJoints['finger'+side]=clamp(Number(degrees)||0,0,28);if(this.paused)this._settle();return this;}
    coverEyes(on=true){return this.setState(on?'privacy':'idle');}
    speak(text){const phrase=String(text||'Hola, estoy aquí para ayudarte.').slice(0,240);this.setState('speaking');this.speech={text:phrase,start:performance.now(),duration:Math.max(1500,phrase.length*86)};return this;}
    showOriginal(on){this.original=!!on;this.nodes.originalLayer.setAttribute('opacity',on?'1':'0');this.nodes.puppet.setAttribute('opacity',on?'0':'1');return this;}
    pause(){if(!this.paused)this.pauseStart=performance.now();this.paused=true;this._cancel();return this;}
    resume(){if(this.paused){const elapsed=performance.now()-this.pauseStart;this.start+=elapsed;this.nextBlink+=elapsed;this.blinkStart+=elapsed;if(this.speech)this.speech.start+=elapsed;}this.paused=false;this._schedule();return this;}
    snapshot(){return{state:this.state,paused:this.paused,original:this.original,joints:{...this.current},hands:{...this.handPoses},gaze:this.userGaze,eyeOpen:this.manualEye};}
    _desired(now){
      if(this.paused)now=this.pauseStart;
      const d={...this.target},t=(now-this.start)/1000;
      if(!this.reduce.matches){
        if(this.breathe)d.bounce=-2.4*(1-Math.cos(t*2*Math.PI/4.2));
        if(this.state==='welcome')d.handL+=15*Math.sin(t*2*Math.PI/1.0);
        if(this.state==='thinking')d.head+=.6*Math.sin(t*1.1);
        if(this.state==='celebrate'){d.bounce-=10*Math.max(0,Math.sin(t*2*Math.PI/1.3));d.handR=8*Math.sin(t*4);d.handL=-d.handR;}
        if(this.state==='walking'){d.legR=5*Math.sin(t*5);d.legL=-d.legR;d.footR=-d.legR*.55;d.footL=-d.legL*.55;d.armR=-5*Math.sin(t*5);d.armL=-d.armR;d.bounce-=2*Math.abs(Math.sin(t*5));}
      }
      if(this.userGaze){d.lookX=this.userGaze.x;d.lookY=this.userGaze.y;}
      Object.assign(d,this.userJoints);
      if(this.speech&&this.state==='speaking'){
        const s=this.speech,elapsed=now-s.start,index=Math.floor(elapsed/86),char=s.text[index%Math.max(1,s.text.length)].toLowerCase();
        const pulse=Math.sin((elapsed%172)/172*Math.PI);
        d.mouthOpen=/[\s.,!?]/.test(char)?.05:.2+.7*Math.abs(pulse);
        d.mouthWidth=/[ouóú]/.test(char)?.64:1;
        if(elapsed>s.duration){this.speech=null;this.setState('idle');return{...this.target};}
      }
      if(this.manualMouth){d.mouthOpen=this.manualMouth.open;d.mouthWidth=this.manualMouth.width;}
      return d;
    }
    _settle(){this.current=this._desired(performance.now());for(const k of Object.keys(this.velocity))this.velocity[k]=0;this._render();}
    _tick(now){
      this.raf=0;if(this.disposed||this.paused)return;
      const dt=this.last?Math.min((now-this.last)/1000,.032):.016;this.last=now;
      const desired=this._desired(now);
      if(this.reduce.matches){this.current={...desired};this.current.bounce=0;}
      else{
        // Mass 1, stiffness 100, damping 10; preserve velocity on interruption.
        const steps=3,h=dt/steps;
        for(let step=0;step<steps;step++)for(const k of Object.keys(this.current)){
          const acceleration=100*(desired[k]-this.current[k])-10*this.velocity[k];
          this.velocity[k]+=acceleration*h;this.current[k]+=this.velocity[k]*h;
        }
      }
      if(this.autoBlink&&now>=this.nextBlink&&!['privacy','celebrate'].includes(this.state)){
        this.blinkStart=now;this.nextBlink=now+4300;
      }
      this._render(now);this._schedule();
    }
    _render(now=performance.now()){
      const n=this.nodes,c=this.current;
      for(const [id,[x,y]] of Object.entries(pivots))n[id].setAttribute('transform',`rotate(${c[id].toFixed(3)} ${x} ${y})`);
      n.puppet.setAttribute('transform',`translate(0 ${c.bounce.toFixed(2)})`);
      let opening=this.manualEye===null?c.eyeOpen:this.manualEye;
      const phase=(now-this.blinkStart)/280;
      if(phase>=0&&phase<1){const b=phase<.35?1-phase/.35:phase<.55?0:(phase-.55)/.45;opening=Math.min(opening,b);}
      opening=clamp(opening,0,1);
      for(const [side,x] of [['R',503],['L',750]]){
        const changed=opening<.995||Math.abs(c.lookX)+Math.abs(c.lookY)>.2;
        n['eye'+side+'Parts'].setAttribute('opacity',changed?'1':'0');
        n['eye'+side+'Blink'].setAttribute('transform',`translate(${x} 402) scale(1 ${Math.max(.025,opening).toFixed(3)}) translate(${-x} -402)`);
        n['eye'+side+'Blink'].setAttribute('opacity',String(Math.min(1,opening/.22)));
        n['lid'+side].setAttribute('opacity',opening<.18?String(1-opening/.18):'0');
        const gaze=Math.abs(c.lookX)+Math.abs(c.lookY)>.2;
        n['eye'+side+'Reference'].setAttribute('opacity',gaze?'0':'1');n['eye'+side+'Gaze'].setAttribute('opacity',gaze?'1':'0');
        n['pupil'+side].setAttribute('transform',`translate(${clamp(c.lookX,-8,8).toFixed(2)} ${clamp(c.lookY,-5,5).toFixed(2)})`);
        n['brow'+side+'Parts'].setAttribute('opacity',Math.abs(c['brow'+side])+Math.abs(c.browY)>.15?'1':'0');
        n['brow'+side].setAttribute('transform',`translate(0 ${c.browY.toFixed(2)}) rotate(${c['brow'+side].toFixed(2)} ${x} 291)`);
        const hand=this.handPoses[side];for(const pose of ['Closed','Open','Point'])n['hand'+side+pose].setAttribute('opacity',hand===pose.toLowerCase()?'1':'0');
        n['finger'+side].setAttribute('transform',`rotate(${c['finger'+side].toFixed(2)} 843 605)`);
      }
      const mouthChanged=Math.abs(c.mouthOpen-1)+Math.abs(c.mouthWidth-1)>.015||this.state==='worried';
      n.mouthParts.setAttribute('opacity',mouthChanged?'1':'0');
      n.mouth.setAttribute('transform',`translate(627 473) scale(${clamp(c.mouthWidth,.45,1.3).toFixed(3)} ${clamp(c.mouthOpen,.025,1.2).toFixed(3)}) translate(-627 -473)`);
      const sad=this.state==='worried',closed=c.mouthOpen<.18;
      n.sadMouth.setAttribute('opacity',sad?'1':'0');n.closedMouth.setAttribute('opacity',!sad&&closed?'1':'0');n.mouth.setAttribute('opacity',sad||closed?'0':'1');
    }
    dispose(){this.disposed=true;this._cancel();document.removeEventListener('visibilitychange',this._visibility);}
  }
  BaziPuppet.states=Object.keys(states);global.BaziPuppet=BaziPuppet;
})(window);
