/* Complete inbetween drawings: never superimpose two faces or two arms. */
(function(global){
 'use strict';const clamp=x=>Math.max(0,Math.min(1,x)),targets={welcome:[662,1138],thinking:[663,1168],worried:[645,1160],celebrate:[748,1168],email:[443,1075],privacy:[651,1145],idle:[625,1140]};
 class GestureTimeline{
  constructor(){this.current={pose:'idle',p:0};this.legs=[];this.duration=0;this.target='idle';}
  setTarget(target,from=this.current){if(from.pose==='idle')from={pose:'idle',p:0};this.target=target;this.start={...from};this.legs=[];const add=(pose,start,end)=>{if(Math.abs(end-start)>1e-8)this.legs.push({pose,start,end,duration:Math.max(80,650*Math.abs(end-start))});};if(from.pose===target){if(target!=='idle')add(target,from.p,1);}else{if(from.pose!=='idle')add(from.pose,from.p,0);if(target!=='idle')add(target,0,1);}this.duration=this.legs.reduce((s,l)=>s+l.duration,0);return this;}
  sample(fraction){let elapsed=clamp(fraction)*this.duration;for(const l of this.legs){if(elapsed<l.duration)return{pose:l.pose,p:l.start+(l.end-l.start)*elapsed/l.duration};elapsed-=l.duration;}return{pose:this.target,p:this.target==='idle'?0:1};}
  advance(fraction){return this.current=this.sample(fraction);}
 }
 class FrameTransition{
  constructor(canvas,sources,sequences){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.sources=sources;this.sequences=new Map(sequences.map(s=>[s.pose,s]));this.images=new Map();this.frame=-1;}
  async load(){await Promise.all([...this.sequences].map(async([key,s])=>{const image=new Image();image.src=s.path;await image.decode();this.images.set(key,image);}));}
  render(pose,p){const size=Math.min(1254,Math.ceil(this.canvas.clientWidth*(devicePixelRatio||1)));if(this.canvas.width!==size)this.canvas.width=this.canvas.height=size;const ctx=this.ctx;ctx.setTransform(size/1254,0,0,size/1254,0,0);ctx.clearRect(0,0,1254,1254);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   if(p<=0||pose==='idle'){ctx.drawImage(this.sources.get('idle'),0,0,1254,1254);this.frame=-1;return;}if(p>=1){ctx.drawImage(this.sources.get(pose),0,0,1254,1254);this.frame=-1;return;}
   const seq=this.sequences.get(pose),i=seq.usable[Math.min(seq.usable.length-1,Math.floor(p*seq.usable.length))],f=seq.frames[i],r=f.rect,a=BaziOriginalBounds.idle,b=BaziOriginalBounds[pose],dest=a.map((n,j)=>n+(b[j]-n)*p);
   ctx.drawImage(this.images.get(pose),...r,...dest);this.frame=i;
  }
 }
 global.BaziFrames={GestureTimeline,FrameTransition};
})(typeof window==='undefined'?globalThis:window);
