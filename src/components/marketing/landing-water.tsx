"use client";
import { useEffect, useRef } from "react";
import styles from "./landing-water.module.css";

const vertex = `attribute vec2 a; varying vec2 uv; void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const common = `precision highp float; varying vec2 uv; uniform sampler2D field; uniform vec2 pixel;
float unpack(vec2 x){return (x.x+x.y/255.)*2.-1.;}
vec2 pack(float h){vec2 e=fract(vec2(1.,255.)*clamp(h*.5+.5,0.0001,.9999));e.x-=e.y/255.;return e;}
float height(vec2 p){return unpack(texture2D(field,clamp(p,pixel,1.-pixel)).rg);}`;
const simulation = `${common}
uniform vec4 drop; uniform vec2 previous; uniform float aspect;
void main(){vec4 state=texture2D(field,uv);float h=unpack(state.rg);float old=unpack(state.ba);
float sum=height(uv+vec2(pixel.x,0.))+height(uv-vec2(pixel.x,0.))+height(uv+vec2(0.,pixel.y))+height(uv-vec2(0.,pixel.y));
float diagonal=height(uv+pixel)+height(uv-pixel)+height(uv+vec2(pixel.x,-pixel.y))+height(uv+vec2(-pixel.x,pixel.y));
float next=(sum*.24+diagonal*.06+h*.8-old)*.985;
vec2 p=uv*vec2(aspect,1.);vec2 start=previous*vec2(aspect,1.);vec2 end=drop.xy*vec2(aspect,1.);vec2 d=end-start;
float line=clamp(dot(p-start,d)/max(dot(d,d),.00001),0.,1.);float distance=length(p-(start+line*d));
next+=exp(-distance*distance/0.00024)*drop.z;
gl_FragColor=vec4(pack(clamp(next,-.9,.9)),pack(h));}`;
const display = `${common}
uniform float lightMode; uniform float fade; uniform vec2 focus; uniform float aspect;
void main(){float h=height(uv);vec2 slope=vec2(height(uv+vec2(pixel.x,0.))-height(uv-vec2(pixel.x,0.)),height(uv+vec2(0.,pixel.y))-height(uv-vec2(0.,pixel.y)));
vec3 normal=normalize(vec3(slope*28.,1.));vec3 light=normalize(vec3(-.5,.65,1.));
float shine=pow(max(dot(reflect(-light,normal),vec3(0.,0.,1.)),0.),22.);
float energy=smoothstep(.003,.08,length(slope)*12.+abs(h)*.3);float rim=pow(abs(dot(normal,light)),4.);
float localMask=1.-smoothstep(.05,.42,length((uv-focus)*vec2(aspect,1.)));
float alpha=energy*clamp(shine*.18+rim*.06,.0,.16)*localMask;
vec3 color=mix(vec3(.72),vec3(.16),lightMode);
gl_FragColor=vec4(color,alpha*fade);}`;

/** Local height-field simulation. Pointer impulses propagate through neighbouring pixels. */
export function LandingWater() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const canvas: HTMLCanvasElement = element;
    const preference = matchMedia("(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)");
    let dispose: (() => void) | undefined;
    function start() {
      dispose?.(); dispose=undefined;
      if (!preference.matches) { canvas.dataset.waterActive="false"; return; }
      const context = canvas.getContext("webgl", { alpha:true, antialias:false, depth:false, premultipliedAlpha:false });
      if (!context) { canvas.dataset.waterActive="unavailable"; return; }
      const gl: WebGLRenderingContext = context;
      const shaders: WebGLShader[]=[];
      const program = (fragment: string) => {
        const p=gl.createProgram()!;
        for (const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const) {
          const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);shaders.push(shader);
          if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) { gl.deleteProgram(p); return null; }
          gl.attachShader(p,shader);
        }
        gl.linkProgram(p);return gl.getProgramParameter(p,gl.LINK_STATUS) ? p : null;
      };
      const step=program(simulation), render=program(display);
      if (!step || !render) { shaders.forEach(s=>gl.deleteShader(s)); canvas.dataset.waterActive="unavailable"; return; }
      const buffer=gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      const textures:WebGLTexture[]=[], frames:WebGLFramebuffer[]=[];
      const width=384, height=Math.max(96,Math.round(width*innerHeight/innerWidth));
      for(let i=0;i<2;i++) { const texture=gl.createTexture()!; const frame=gl.createFramebuffer()!;
        gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);gl.clearColor(127/255,128/255,127/255,128/255);gl.clear(gl.COLOR_BUFFER_BIT);textures.push(texture);frames.push(frame);
      }
      const resize=()=>{const scale=Math.min(1,1440/innerWidth);canvas.width=Math.round(innerWidth*scale);canvas.height=Math.round(innerHeight*scale);};resize();
      let current=0, raf=0, lastFrame=0, lastInput=0, pending=false, x=.5,y=.5,oldX=.5,oldY=.5;
      const uniform=(p:WebGLProgram,name:string)=>gl.getUniformLocation(p,name);
      const bind=(p:WebGLProgram)=>{gl.useProgram(p);const position=gl.getAttribLocation(p,"a");gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);gl.uniform2f(uniform(p,"pixel"),1/width,1/height);gl.uniform1i(uniform(p,"field"),0);gl.activeTexture(gl.TEXTURE0);};
      function draw(now:number) {
        raf=0;if(document.hidden || !preference.matches) return;
        if(now-lastInput>2600) {for(const frame of frames){gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.clearColor(127/255,128/255,127/255,128/255);gl.clear(gl.COLOR_BUFFER_BIT);}gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);canvas.dataset.waterActive="idle";return;}
        if(now-lastFrame<30){raf=requestAnimationFrame(draw);return;}lastFrame=now;
        for(let i=0;i<2;i++) {const next=1-current;bind(step!);gl.bindFramebuffer(gl.FRAMEBUFFER,frames[next]);gl.viewport(0,0,width,height);gl.bindTexture(gl.TEXTURE_2D,textures[current]);gl.uniform4f(uniform(step!,"drop"),x,y,pending&&i===0?.085:0,0);gl.uniform2f(uniform(step!,"previous"),oldX,oldY);gl.uniform1f(uniform(step!,"aspect"),innerWidth/innerHeight);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);current=next;}
        pending=false;oldX=x;oldY=y;bind(render!);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.bindTexture(gl.TEXTURE_2D,textures[current]);gl.uniform1f(uniform(render!,"lightMode"),document.documentElement.classList.contains("dark")?0:1);gl.uniform1f(uniform(render!,"fade"),Math.min(1,(2600-(now-lastInput))/800));gl.uniform2f(uniform(render!,"focus"),x,y);gl.uniform1f(uniform(render!,"aspect"),innerWidth/innerHeight);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);raf=requestAnimationFrame(draw);
      }
      const pointer=(event:PointerEvent)=>{if(event.pointerType!=="mouse")return;x=event.clientX/innerWidth;y=1-event.clientY/innerHeight;if(performance.now()-lastInput>200){oldX=x;oldY=y;}pending=true;lastInput=performance.now();canvas.dataset.waterActive="true";if(!raf)raf=requestAnimationFrame(draw);};
      const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{lastInput=0;}};
      const contextLost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(raf);canvas.dataset.waterActive="unavailable";};
      window.addEventListener("pointermove",pointer,{passive:true});window.addEventListener("resize",resize);document.addEventListener("visibilitychange",visibility);canvas.addEventListener("webglcontextlost",contextLost);canvas.dataset.waterActive="idle";
      dispose=()=>{cancelAnimationFrame(raf);window.removeEventListener("pointermove",pointer);window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",visibility);canvas.removeEventListener("webglcontextlost",contextLost);textures.forEach(t=>gl.deleteTexture(t));frames.forEach(f=>gl.deleteFramebuffer(f));shaders.forEach(s=>gl.deleteShader(s));gl.deleteBuffer(buffer);gl.deleteProgram(step);gl.deleteProgram(render);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);};
    }
    start();preference.addEventListener("change",start);
    return()=>{preference.removeEventListener("change",start);dispose?.();};
  },[]);
  return <canvas ref={ref} className={styles.water} aria-hidden="true" data-water-active="false" />;
}
