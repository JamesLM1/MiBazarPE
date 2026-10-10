const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'mesh-motion.js'),'utf8'),context);const {actions,deform}=context.BaziMotion;
const result=[];
for(const state of Object.keys(actions)){
  let minArea=Infinity,maxDisplacement=0;const cells=40,step=1254/cells,area=step*step;
  for(const t of [0,1])for(let y=0;y<=1254;y+=step)for(let x=0;x<=1254;x+=step){const p=deform(x,y,state,t);assert.equal(p[0],x);assert.equal(p[1],y);}
  for(let frame=1;frame<40;frame++){
    const t=frame/40,points=[];
    for(let row=0;row<=cells;row++)for(let col=0;col<=cells;col++){const x=col*step,y=row*step,p=deform(x,y,state,t);assert.ok(p.every(Number.isFinite));maxDisplacement=Math.max(maxDisplacement,Math.hypot(p[0]-x,p[1]-y));points.push(p);}
    function triangle(a,b,c){const v=((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/area;minArea=Math.min(minArea,v);assert.ok(v>0,`${state} folds at ${t}: ${v}`);}
    for(let row=0;row<cells;row++)for(let col=0;col<cells;col++){const a=row*(cells+1)+col,b=a+1,c=a+cells+1,d=c+1;triangle(points[a],points[b],points[c]);triangle(points[b],points[d],points[c]);}
  }
  assert.ok(maxDisplacement>1,`${state} has no motion`);
  result.push({action:state,identity_at_start_and_end:true,finite_coordinates:true,no_folded_triangles:true,min_area_ratio:Number(minArea.toFixed(4)),max_displacement_px:Number(maxDisplacement.toFixed(2))});
}
fs.writeFileSync(path.join(__dirname,'verificacion_malla.json'),JSON.stringify({actions:result.length,passed:result},null,2));console.log(JSON.stringify({actions:result.length,all_passed:true,motion:result.map(r=>({action:r.action,px:r.max_displacement_px,minArea:r.min_area_ratio}))}));
