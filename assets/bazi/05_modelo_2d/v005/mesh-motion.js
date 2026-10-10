/* Animate one connected texture mesh. Original artwork is never cut into sprites. */
(function(global){
  'use strict';
  const S=1254,TAU=Math.PI*2;
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const actions={
    idle:{pose:'idle',duration:2600,label:'Respirar'},
    welcome:{pose:'welcome',duration:2600,label:'Saludar'},
    thinking:{pose:'thinking',duration:2800,label:'Pensar'},
    worried:{pose:'worried',duration:2600,label:'Preocupación'},
    celebrate:{pose:'celebrate',duration:2600,label:'Celebrar'},
    email:{pose:'email',duration:2600,label:'Señalar correo'},
    privacy:{pose:'privacy',duration:2600,label:'Proteger contraseña'},
    walking:{pose:'idle',duration:3000,label:'Pasos'},
    speaking:{pose:'welcome',duration:3200,label:'Hablar'}
  };
  function weight(x,y,cx,cy,rx,ry){const r=((x-cx)/rx)**2+((y-cy)/ry)**2;return Math.exp(-r*2);}
  function rotate(p,ox,oy,angle,w){const x=p[0]-ox,y=p[1]-oy,c=Math.cos(angle),s=Math.sin(angle);p[0]+=(x*c-y*s-x)*w;p[1]+=(x*s+y*c-y)*w;}
  function deform(x,y,state,t){
    if(t<=0||t>=1)return[x,y];
    // Zero displacement AND velocity at both ends. Final pose is the exact source.
    const env=Math.sin(Math.PI*t)**2,wave=Math.sin(TAU*t*2.5),p=[x,y];
    const head=(angle,px=635,py=590)=>rotate(p,px,py,angle*env,1-smooth(530,680,y));
    const joint=(ox,oy,cx,cy,rx,ry,angle)=>rotate(p,ox,oy,angle*env,weight(x,y,cx,cy,rx,ry));
    if(state==='idle'){p[1]-=5*env;p[0]+=(x-627)*.004*env*(1-smooth(950,1130,y));}
    if(state==='welcome'){
      // The open paw, ribbed cuff and forearm share the same continuous deformation.
      joint(445,790,255,820,235,185,.18*wave);
      joint(930,750,970,625,120,200,-.045*wave);
      head(.024*Math.sin(TAU*t));
    }
    if(state==='thinking'){
      head(.05*Math.sin(TAU*t),670,595);
      // Chin hand follows the head gently; sleeve/root remains connected by falloff.
      joint(480,775,630,610,160,195,.038*Math.sin(TAU*t));
    }
    if(state==='worried'){
      head(.023*wave,665,620);
      joint(780,765,748,620,145,195,.042*wave);
      joint(427,770,570,790,185,140,-.028*wave);
    }
    if(state==='celebrate'){
      const hop=Math.max(0,Math.sin(TAU*t*3));p[1]-=42*hop*env;
      joint(410,665,235,505,230,240,.09*wave);
      joint(900,660,1040,460,205,260,-.09*wave);
      joint(455,995,400,1070,190,200,.05*wave);
    }
    if(state==='email'){
      joint(682,745,827,640,240,180,-.06*wave);
      head(.022*Math.sin(TAU*t),470,580);
    }
    if(state==='privacy'){
      joint(425,715,810,585,280,200,.05*wave);
      head(.03*Math.sin(TAU*t),555,580);
    }
    if(state==='walking'){
      const step=Math.sin(TAU*t*3);joint(485,1020,470,1115,165,195,.065*step);
      joint(755,1020,770,1115,165,195,-.065*step);p[1]-=8*Math.abs(step)*env;
      joint(395,675,285,825,140,225,-.035*step);joint(860,675,965,825,140,225,.035*step);
    }
    if(state==='speaking'){
      const pulse=Math.sin(TAU*t*11),mouth=weight(x,y,625,550,105,82);
      p[1]+=(y-515)*.2*pulse*env*mouth;
      head(.026*Math.sin(TAU*t*2));joint(930,750,970,625,120,200,.035*wave);
    }
    return p;
  }
  class ConnectedMesh {
    constructor(canvas){
      this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,preserveDrawingBuffer:true});
      if(!this.gl)throw new Error('Este navegador no ofrece WebGL para animar a Bazi.');
      const gl=this.gl;
      function shader(type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh;}
      this.program=gl.createProgram();gl.attachShader(this.program,shader(gl.VERTEX_SHADER,'attribute vec2 aPosition; attribute vec2 aUV; varying vec2 vUV; void main(){vUV=aUV;gl_Position=vec4(aPosition.x*2.0-1.0,1.0-aPosition.y*2.0,0.0,1.0);}'));
      gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec2 vUV; uniform sampler2D image; void main(){gl_FragColor=texture2D(image,vUV);}'));
      gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
      const cells=72;this.base=[];const uv=[],index=[];
      for(let row=0;row<=cells;row++)for(let col=0;col<=cells;col++){this.base.push([col/cells*S,row/cells*S]);uv.push(col/cells,row/cells);}
      for(let row=0;row<cells;row++)for(let col=0;col<cells;col++){const a=row*(cells+1)+col,b=a+1,c=a+cells+1,d=c+1;index.push(a,c,b,b,c,d);}
      this.positions=new Float32Array(this.base.length*2);this.positionBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.positions,gl.DYNAMIC_DRAW);
      const pa=gl.getAttribLocation(this.program,'aPosition');gl.enableVertexAttribArray(pa);gl.vertexAttribPointer(pa,2,gl.FLOAT,false,0,0);
      const uvb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,uvb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uv),gl.STATIC_DRAW);const ua=gl.getAttribLocation(this.program,'aUV');gl.enableVertexAttribArray(ua);gl.vertexAttribPointer(ua,2,gl.FLOAT,false,0,0);
      const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(index),gl.STATIC_DRAW);this.count=index.length;
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);this.textures=new Map();
    }
    add(key,image){const gl=this.gl,tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);this.textures.set(key,tex);}
    render(key,action,t){
      const gl=this.gl,size=Math.min(1600,Math.ceil(this.canvas.clientWidth*(devicePixelRatio||1)));
      if(this.canvas.width!==size){this.canvas.width=size;this.canvas.height=size;}gl.viewport(0,0,size,size);
      this.base.forEach(([x,y],i)=>{const p=deform(x,y,action,t);this.positions[i*2]=p[0]/S;this.positions[i*2+1]=p[1]/S;});
      gl.bindBuffer(gl.ARRAY_BUFFER,this.positionBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.positions);gl.bindTexture(gl.TEXTURE_2D,this.textures.get(key));gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
    }
  }
  global.BaziMotion={actions,deform,ConnectedMesh};
})(typeof window==='undefined'?globalThis:window);
