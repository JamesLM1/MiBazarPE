import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {after,beforeEach,mock,test} from 'node:test';
const root=new URL('../src/features/bazi/',import.meta.url);
const hooks=registerHooks({resolve(specifier,context,next){
 if(specifier==='server-only')return {url:'data:text/javascript,export {};',shortCircuit:true};
 if(specifier==='next/navigation')return next(specifier+'.js',context);
 if(context.parentURL?.includes('/features/bazi/')&&specifier.startsWith('./')&&!specifier.endsWith('.ts'))return {url:new URL(specifier+'.ts',root).href,shortCircuit:true};
 return next(specifier,context);
}});
let auth,calls,collision;
const key='11111111-1111-4111-8111-111111111111';
const row={id:key,titulo:'Rutina',tipo:'STOCK',frecuencia:'DIARIA',dia:1,hora:'09:00:00'};
const db={rpc:async(name,args)=>{calls.push({name,args});return {data:collision?{saved:false}:{saved:true,version:2},error:null};},from(table){const builder={select(){return builder;},eq(k,v){calls.push({table,k,v});return builder;},update(value){calls.push({table,update:value});return builder;},insert(value){calls.push({table,insert:value});return builder;},maybeSingle:async()=>({data:row,error:null}),single:async()=>({data:{id:key},error:null})};return builder;}};
mock.module(new URL('data.ts',root).href,{exports:{getBaziContext:async()=>auth}});
mock.module(new URL('persistence.ts',root).href,{exports:{programRoutine:async(a,input)=>{calls.push({program:input,business:a.businessId});return key;},resources:async()=>({routines:[],memories:[],runs:[]})}});
mock.module('next/navigation.js',{exports:{unstable_rethrow(){}}});
const api=await import('../src/features/bazi/persistence-actions.ts');
beforeEach(()=>{calls=[];collision=false;auth={scope:'scope-a',businessId:'business-a',clientId:null,isClient:false,canManage:true,context:{user:{id:'owner',role:'DUENO_BAZAR'}},db};});
after(()=>hooks.deregister());
test('Bazi persistencia: cambiar de contexto bloquea guardar antes de consultar la base',async()=>{
 const result=await api.saveBaziWorkspace('scope-b',0,{});assert.ok(result.error);assert.equal(calls.length,0);
});
test('Bazi persistencia: el servidor fija usuario, negocio y rol; no conserva tokens ni enlaces ajenos',async()=>{
 const value={external:true,threads:[{id:'t',title:'Hola',exchanges:[{id:'m',question:'q',reply:{text:'r',cards:[{id:'c',kind:'note',links:[{label:'bad',href:'https://evil.example'}]}],proposals:[{id:'p',token:'secret',changes:[]}]}}]}]};
 const result=await api.saveBaziWorkspace('scope-a',1,value);assert.equal(result.version,2);assert.equal(calls[0].args.p_bazar,'business-a');assert.equal(calls[0].args.p_rol,'DUENO_BAZAR');assert.equal(calls[0].args.p_cliente,null);assert.equal(calls[0].args.p_contenido.threads[0].exchanges[0].reply.proposals[0].token,'');assert.equal(calls[0].args.p_contenido.threads[0].exchanges[0].reply.cards[0].links.length,0);
});
test('Bazi persistencia: un conflicto de versión no se presenta como guardado',async()=>{
 collision=true;const result=await api.saveBaziWorkspace('scope-a',1,{});assert.equal(result.conflict,true);assert.equal(result.version,undefined);
});
test('Bazi persistencia: cliente no guarda ni archiva memoria comercial',async()=>{
 auth.isClient=true;auth.canManage=false;auth.context.user.role='CLIENTE';
 assert.ok((await api.saveBaziMemory('scope-a',{title:'Contexto',content:'Texto de ejemplo'})).error);assert.ok((await api.setBaziMemoryActive('scope-a',key,true)).error);assert.equal(calls.length,0);
});
test('Bazi persistencia: cliente programa únicamente MI_CUENTA y usa su negocio fijado',async()=>{
 auth.isClient=true;auth.canManage=false;auth.clientId='mine';auth.context.user.role='CLIENTE';const input={title:'Mis cuotas',kind:'STOCK',frequency:'DIARIA',day:1,time:'10:00'};
 assert.ok((await api.saveBaziRoutine('scope-a',input)).error);assert.equal(calls.length,0);
 assert.ok((await api.saveBaziRoutine('scope-a',{...input,kind:'MI_CUENTA'})).success);assert.equal(calls[0].business,'business-a');
});
test('Bazi persistencia: pausa conserva filtros de usuario, negocio y rol',async()=>{
 assert.ok((await api.setBaziRoutineState('scope-a',key,'pause')).success);
 for(const [k,v] of [['id_usuario','owner'],['id_bazar','business-a'],['rol','DUENO_BAZAR']])assert.ok(calls.some(c=>c.k===k&&c.v===v));
 assert.ok(calls.some(c=>c.update?.activa===false));
});
test('Bazi persistencia: ejecución manual solo usa el RPC autorizado y rechaza IDs arbitrarios',async()=>{
 assert.ok((await api.runBaziRoutine('scope-a','bad')).error);assert.equal(calls.length,0);assert.ok((await api.runBaziRoutine('scope-a',key)).success);assert.equal(calls[0].name,'bazi_ejecutar_rutina');assert.equal(calls[0].args.p_id,key);
});
