/* Correspondence-based 2D pose transition. Inputs remain the original PNGs. */
(function(global){
 'use strict';
 const S=1254,clamp=x=>Math.max(0,Math.min(1,x));
 // Same named anatomical landmarks in every drawing: face, garment, joints, paws.
 const names=['tuft','earL','earR','browL','browR','eyeL','eyeR','nose','mouth','faceL','faceR','jawL','jawR','chin','hoodL','hoodR','neck','chest','logo','hemL','hemC','hemR','kneeL','kneeR','footL','footR','shoulderL','elbowL','cuffL','pawL','shoulderR','elbowR','cuffR','pawR'];
 const raw={
 idle:[[649,100],[375,215],[879,211],[506,291],[754,290],[502,402],[747,402],[625,430],[625,503],[321,398],[926,399],[367,531],[878,531],[624,604],[335,591],[917,591],[626,655],[625,798],[754,755],[418,974],[627,991],[870,973],[495,1070],[753,1070],[475,1166],[777,1166],[384,677],[293,831],[300,899],[300,951],[862,677],[961,831],[950,899],[950,951]],
 thinking:[[586,107],[337,310],[813,181],[513,317],[721,229],[538,407],[760,327],[668,411],[675,455],[321,439],[935,397],[406,563],[883,522],[644,587],[378,622],[925,567],[661,656],[677,850],[808,729],[476,988],[686,1019],[909,986],[530,1092],[784,1092],[509,1172],[815,1172],[458,664],[463,786],[620,638],[660,584],[909,656],[962,834],[737,836],[658,832]],
 worried:[[644,111],[341,265],[873,198],[534,350],[763,316],[526,449],[779,410],[667,465],[666,534],[314,433],[963,404],[376,566],[877,564],[664,625],[359,627],[947,593],[669,684],[648,862],[758,806],[436,997],[651,1028],[861,1000],[522,1097],[758,1097],[526,1171],[766,1171],[429,695],[402,839],[515,800],[591,781],[873,683],[886,756],[807,680],[749,611]],
 celebrate:[[611,92],[337,287],[855,188],[504,316],[749,244],[520,400],[778,352],[656,395],[658,481],[326,437],[942,397],[417,553],[873,525],[658,596],[408,583],[906,553],[662,650],[660,797],[809,739],[423,855],[646,956],[879,973],[475,964],[741,1084],[410,1033],[748,1172],[435,669],[342,644],[265,579],[224,494],[884,650],[983,588],[1028,518],[1061,436]],
 privacy:[[521,113],[245,333],[721,210],[448,369],[652,295],[458,442],[685,371],[590,436],[593,498],[239,459],[842,423],[330,594],[769,563],[566,605],[276,648],[818,589],[593,676],[593,826],[699,817],[368,939],[587,1005],[817,953],[391,1058],[771,1054],[349,1157],[823,1158],[381,669],[473,703],[650,684],[707,628],[768,645],[824,618],[852,598],[875,556]],
 welcome:[[580,165],[311,361],[781,218],[498,392],[710,309],[509,485],[734,413],[637,476],[642,549],[333,502],[910,447],[418,623],[865,582],[648,655],[331,666],[872,623],[669,705],[655,847],[794,798],[448,1003],[670,1026],[886,1004],[513,1091],[783,1091],[491,1175],[810,1175],[433,724],[395,842],[353,861],[257,835],[869,690],[967,803],[975,715],[975,650]],
 email:[[395,181],[162,366],[552,252],[327,371],[522,305],[343,469],[548,407],[465,453],[470,517],[165,488],[681,438],[250,609],[626,562],[446,628],[171,653],[660,593],[475,676],[481,820],[607,745],[335,966],[507,993],[682,953],[342,1075],[573,1067],[283,1170],[590,1168],[285,706],[220,828],[268,817],[336,821],[651,661],[745,705],[809,652],[844,611]]
 };
 const anchors={};for(const [pose,points] of Object.entries(raw))anchors[pose]=Object.fromEntries(names.map((n,i)=>[n,points[i]]));
 // Contours are correspondences too: joints alone do not align fur/ear silhouettes.
 const contours={
 idle:[[241,221],[287,97],[378,74],[488,112],[449,294],[327,346],[916,82],[1008,150],[1017,260],[939,342],[431,163],[821,142],[937,477],[824,568],[445,570],[312,480]],
 thinking:[[199,319],[239,204],[336,170],[436,195],[412,388],[317,440],[839,49],[937,126],[951,240],[887,310],[463,166],[773,133],[934,465],[827,562],[423,574],[329,526]],
 worried:[[197,259],[232,144],[338,116],[451,140],[417,355],[315,395],[878,63],[976,121],[1005,231],[936,333],[469,153],[829,147],[952,485],[842,591],[418,588],[315,534]],
 celebrate:[[207,294],[238,187],[337,139],[446,171],[411,380],[315,416],[862,63],[962,121],[984,219],[923,315],[458,165],[800,128],[944,461],[829,561],[450,557],[330,503]],
 privacy:[[113,330],[149,231],[251,191],[353,203],[316,419],[231,466],[737,86],[828,148],[859,243],[803,332],[368,178],[681,138],[829,486],[740,559],[374,601],[249,547]],
 welcome:[[174,364],[215,256],[316,222],[419,244],[389,456],[304,501],[803,91],[889,152],[891,258],[846,324],[440,233],[736,175],[898,500],[820,604],[455,629],[342,570]],
 email:[[47,363],[68,291],[157,240],[247,258],[232,428],[145,482],[572,141],[641,192],[670,275],[630,338],[271,246],[518,223],[681,490],[609,575],[297,610],[181,569]]
 };
 for(let i=0;i<16;i++){const n='contour'+i;names.push(n);for(const pose of Object.keys(raw))anchors[pose][n]=contours[pose][i];}
 const arms={
 idle:[[297,888],[232,946],[299,1007],[374,950],[222,825],[353,725],[384,844],[951,889],[878,952],[951,1007],[1030,947],[1030,826],[925,727],[870,844]],
 welcome:[[166,772],[141,837],[263,934],[357,836],[314,933],[342,756],[438,877],[986,515],[891,647],[991,730],[1064,676],[1068,783],[916,746],[905,845]],
 thinking:[[695,500],[578,598],[681,676],[745,590],[396,752],[476,675],[530,820],[651,769],[584,832],[674,896],[733,835],[1008,835],[954,737],[931,903]],
 worried:[[593,700],[526,766],[596,856],[659,784],[342,804],[423,733],[439,900],[747,535],[682,606],[757,687],[833,612],[974,749],[909,642],[884,821]],
 celebrate:[[220,392],[126,494],[226,587],[320,492],[242,650],[321,599],[405,744],[1064,335],[970,431],[1065,531],[1155,431],[1084,541],[936,563],[919,711]],
 privacy:[[737,546],[615,658],[673,731],[776,617],[401,764],[423,628],[574,771],[875,443],[768,555],[866,669],[997,555],[808,625],[807,575],[826,674]],
 email:[[347,743],[268,800],[332,887],[406,800],[147,823],[258,744],[240,901],[867,532],[773,607],[844,689],[913,612],[813,705],[761,584],[677,783]]
 };
 for(let i=0;i<14;i++){const n='armContour'+i;names.push(n);for(const pose of Object.keys(raw))anchors[pose][n]=arms[pose][i];}
 // Strong ease-in-out prescribed by the animation skill, solved by bisection.
 function ease(t){if(t<=0||t>=1)return clamp(t);let lo=0,hi=1,u=.5;for(let i=0;i<16;i++){u=(lo+hi)/2;const x=3*(1-u)**2*u*.77+3*(1-u)*u*u*.175+u*u*u;if(x<t)lo=u;else hi=u;}return 3*(1-u)*u*u+u*u*u;}
 function interpolate(a,b,t){return names.map(n=>[a[n][0]+(b[n][0]-a[n][0])*t,a[n][1]+(b[n][1]-a[n][1])*t]);}
 const boundary=[[0,0],[627,0],[1254,0],[1254,627],[1254,1254],[627,1254],[0,1254],[0,627]];
 // Thin plate spline: inverse UV map for each original, sharing intermediate joints.
 function spline(from,to){
   const p=from.concat(boundary).map(v=>v.map(x=>x/S)),q=to.concat(boundary).map(v=>v.map(x=>x/S)),n=p.length,m=n+3;
   const A=Array.from({length:m},()=>new Float64Array(m+2));
   const kernel=r=>r<1e-14?0:r*Math.log(r);
   for(let i=0;i<n;i++){for(let j=0;j<n;j++){const r=(p[i][0]-p[j][0])**2+(p[i][1]-p[j][1])**2;A[i][j]=kernel(r)+(i===j?1e-7:0);}A[i][n]=1;A[i][n+1]=p[i][0];A[i][n+2]=p[i][1];A[n][i]=1;A[n+1][i]=p[i][0];A[n+2][i]=p[i][1];A[i][m]=q[i][0];A[i][m+1]=q[i][1];}
   for(let k=0;k<m;k++){let pivot=k;for(let i=k+1;i<m;i++)if(Math.abs(A[i][k])>Math.abs(A[pivot][k]))pivot=i;[A[k],A[pivot]]=[A[pivot],A[k]];const d=A[k][k];if(Math.abs(d)<1e-14)throw new Error('Puntos de transición incompatibles');for(let j=k;j<m+2;j++)A[k][j]/=d;for(let i=0;i<m;i++)if(i!==k){const f=A[i][k];for(let j=k;j<m+2;j++)A[i][j]-=f*A[k][j];}}
   return(x,y)=>{x/=S;y/=S;let u=A[n][m]+x*A[n+1][m]+y*A[n+2][m],v=A[n][m+1]+x*A[n+1][m+1]+y*A[n+2][m+1];for(let i=0;i<n;i++){const r=(x-p[i][0])**2+(y-p[i][1])**2,k=kernel(r);u+=A[i][m]*k;v+=A[i][m+1]*k;}return[u,v];};
 }
 class PoseTransition{
   constructor(canvas){
     this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true});if(!gl)throw new Error('No se puede reproducir la transición 2D.');
     const shader=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
     this.program=gl.createProgram();gl.attachShader(this.program,shader(gl.VERTEX_SHADER,'attribute vec2 position;attribute vec2 uvA;attribute vec2 uvB;varying vec2 a;varying vec2 b;void main(){a=uvA;b=uvB;gl_Position=vec4(position.x*2.0-1.0,1.0-position.y*2.0,0.0,1.0);}'));
     gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 a;varying vec2 b;uniform sampler2D imageA;uniform sampler2D imageB;uniform float blend;vec4 sampleSafe(sampler2D s,vec2 p){if(p.x<0.0||p.y<0.0||p.x>1.0||p.y>1.0)return vec4(0.0);return texture2D(s,p);}void main(){gl_FragColor=mix(sampleSafe(imageA,a),sampleSafe(imageB,b),blend);}'));
     gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
     const cells=64,vertices=[],indices=[];this.base=[];
     for(let y=0;y<=cells;y++)for(let x=0;x<=cells;x++){vertices.push(x/cells,y/cells);this.base.push([x/cells*S,y/cells*S]);}
     for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){const a=y*(cells+1)+x,b=a+1,c=a+cells+1,d=c+1;indices.push(a,c,b,b,c,d);}
     const bind=(name,data,usage)=>{const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,usage);const loc=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);return buffer;};
     bind('position',new Float32Array(vertices),gl.STATIC_DRAW);this.a=new Float32Array(vertices.length);this.b=new Float32Array(vertices.length);this.ab=bind('uvA',this.a,gl.DYNAMIC_DRAW);this.bb=bind('uvB',this.b,gl.DYNAMIC_DRAW);
     const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);this.count=indices.length;
     this.blend=gl.getUniformLocation(this.program,'blend');gl.uniform1i(gl.getUniformLocation(this.program,'imageA'),0);gl.uniform1i(gl.getUniformLocation(this.program,'imageB'),1);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);this.textures=new Map();
     this.warpProgram=gl.createProgram();gl.attachShader(this.warpProgram,shader(gl.VERTEX_SHADER,'attribute vec2 position;attribute vec2 uv;varying vec2 a;void main(){a=uv;gl_Position=vec4(position.x*2.0-1.0,1.0-position.y*2.0,0.0,1.0);}'));gl.attachShader(this.warpProgram,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 a;uniform sampler2D image;void main(){gl_FragColor=texture2D(image,a);}'));gl.linkProgram(this.warpProgram);
     this.staticVertices=new Float32Array(vertices);this.posBuffer=gl.createBuffer();this.uvBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.uvBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.staticVertices,gl.STATIC_DRAW);this.indexBuffer=ib;
     this.targets=[0,1].map(()=>{const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1024,1024,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);return{texture,framebuffer};});gl.bindFramebuffer(gl.FRAMEBUFFER,null);
     this.mixProgram=gl.createProgram();gl.attachShader(this.mixProgram,shader(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=vec2(position.x,1.0-position.y);gl_Position=vec4(position.x*2.0-1.0,1.0-position.y*2.0,0.0,1.0);}'));gl.attachShader(this.mixProgram,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D imageA;uniform sampler2D imageB;uniform float blend;void main(){gl_FragColor=mix(texture2D(imageA,uv),texture2D(imageB,uv),blend);}'));gl.linkProgram(this.mixProgram);
   }
   add(key,image){const gl=this.gl;let tex=this.textures.get(key);if(!tex){tex=gl.createTexture();this.textures.set(key,tex);}gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);}
   render(from,to,t,fromPoints,toPoints){
     const gl=this.gl,size=Math.min(1254,Math.ceil(this.canvas.clientWidth*(devicePixelRatio||1)));if(this.canvas.width!==size)this.canvas.width=this.canvas.height=size;gl.viewport(0,0,size,size);
     const p=ease(t),middle=interpolate(fromPoints,toPoints,p);
     if(this.cachedFrom!==fromPoints||this.cachedTo!==toPoints){
       const fa=spline(names.map(n=>fromPoints[n]),names.map(n=>toPoints[n])),fb=spline(names.map(n=>toPoints[n]),names.map(n=>fromPoints[n]));
       this.endA=this.base.map(([x,y])=>fa(x,y));this.endB=this.base.map(([x,y])=>fb(x,y));this.cachedFrom=fromPoints;this.cachedTo=toPoints;
     }
     const attribute=(program,name,buffer)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);};
     const pass=(key,field,fraction,target)=>{
       this.base.forEach(([x,y],i)=>{const v=field[i];this.a[i*2]=x/S+(v[0]-x/S)*fraction;this.a[i*2+1]=y/S+(v[1]-y/S)*fraction;});
       gl.bindFramebuffer(gl.FRAMEBUFFER,target.framebuffer);gl.viewport(0,0,1024,1024);gl.useProgram(this.warpProgram);gl.bindBuffer(gl.ARRAY_BUFFER,this.posBuffer);gl.bufferData(gl.ARRAY_BUFFER,this.a,gl.DYNAMIC_DRAW);attribute(this.warpProgram,'position',this.posBuffer);attribute(this.warpProgram,'uv',this.uvBuffer);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures.get(key));gl.uniform1i(gl.getUniformLocation(this.warpProgram,'image'),0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
     };
     pass(from,this.endA,p,this.targets[0]);pass(to,this.endB,1-p,this.targets[1]);
     gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,size,size);gl.useProgram(this.mixProgram);attribute(this.mixProgram,'position',this.uvBuffer);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.targets[0].texture);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.targets[1].texture);gl.uniform1i(gl.getUniformLocation(this.mixProgram,'imageA'),0);gl.uniform1i(gl.getUniformLocation(this.mixProgram,'imageB'),1);gl.uniform1f(gl.getUniformLocation(this.mixProgram,'blend'),p);gl.disable(gl.BLEND);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
     return Object.fromEntries(names.map((n,i)=>[n,middle[i]]));
   }
 }
 global.BaziTransition={PoseTransition,anchors,names,ease,interpolate,spline};
})(typeof window==='undefined'?globalThis:window);
