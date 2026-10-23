import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {after,beforeEach,mock,test} from 'node:test';

const serverUrl=new URL('../src/infrastructure/supabase/server.ts',import.meta.url).href;
const contextUrl=new URL('../src/features/dashboard/context.ts',import.meta.url).href;
const hooks=registerHooks({resolve(specifier,context,next){
 if(specifier==='@/infrastructure/supabase/server')return {url:serverUrl,shortCircuit:true};
 if(specifier==='@/features/dashboard/context')return {url:contextUrl,shortCircuit:true};
 if(['next/cache','next/headers','next/navigation'].includes(specifier))return next(`${specifier}.js`,context);
 return next(specifier,context);
}});
let context,rpcResult,cookieWrites,revalidated,calls;
mock.module(contextUrl,{exports:{getPrivateContext:async()=>context}});
mock.module(serverUrl,{exports:{getSupabaseServerClient:async()=>({rpc:async(name,args)=>{calls.push({name,args});return rpcResult;}})}});
mock.module('next/cache.js',{exports:{revalidatePath:(...args)=>revalidated.push(args)}});
mock.module('next/headers.js',{exports:{cookies:async()=>({set:(...args)=>cookieWrites.push(args)})}});
mock.module('next/navigation.js',{exports:{redirect:path=>{throw new Error(`REDIRECT:${path}`);}}});
const {saveBusiness,saveProfile}=await import('../src/features/access/actions.ts');
after(()=>hooks.deregister());
const newId='11111111-1111-4111-8111-111111111111';
beforeEach(()=>{
 context={user:{id:'test-user',role:'DUENO_BAZAR'},business:{id:'older-business'}};
 rpcResult={data:newId,error:null};cookieWrites=[];revalidated=[];calls=[];
});
function business(continuation=''){
 const f=new FormData();f.set('create','yes');f.set('nombre','QA business');f.set('ruc','20999909998');
 f.set('razon_social','QA temporary');f.set('direccion','Test address');f.set('continue',continuation);return f;
}
test('creation selects the returned business instead of retaining an older selection; inline setup stays on the importer',async()=>{
 const answer=await saveBusiness({},business());
 assert.match(answer.success,/Negocio creado/);
 assert.equal(calls[0].args.p_bazar,null);
 assert.equal(cookieWrites.length,1);
 assert.equal(cookieWrites[0][0],'mibazarpe-business');
 assert.equal(cookieWrites[0][1],newId);
 assert.equal(cookieWrites[0][2].httpOnly,true);
 assert.equal(cookieWrites[0][2].sameSite,'lax');
 assert.deepEqual(revalidated,[['/','layout']]);
});
test('standalone creation navigates to the dashboard only after selecting the new business',async()=>{
 await assert.rejects(saveBusiness({},business('dashboard')),/REDIRECT:\/dashboard/);
 assert.equal(cookieWrites[0][1],newId);
 assert.equal(revalidated.length,1);
});
test('a failed creation never changes selection or claims a business exists',async()=>{
 rpcResult={data:null,error:{message:'ACCESO_DENEGADO'}};
 const answer=await saveBusiness({},business('dashboard'));
 assert.ok(answer.error);assert.equal(answer.success,undefined);assert.deepEqual(cookieWrites,[]);assert.deepEqual(revalidated,[]);
});
test('an unexpected RPC identifier is not trusted as an authorized business selection',async()=>{
 rpcResult={data:'unexpected-id',error:null};
 assert.ok((await saveBusiness({},business())).error);
 assert.deepEqual(cookieWrites,[]);
});
test('editing a business keeps its selection and does not create another establishment',async()=>{
 const f=business();f.delete('create');
 await saveBusiness({},f);
 assert.equal(calls[0].args.p_bazar,'older-business');assert.deepEqual(cookieWrites,[]);
});
test('continuation fields cannot cause an external redirect',async()=>{
 assert.ok((await saveBusiness({},business('https://example.invalid'))).success);
});
function profile(){const f=new FormData();for(const [k,v] of Object.entries({name:'Test Owner',document_type:'DNI',document:'00010001',continue:'create-business'}))f.set(k,v);return f;}
test('an owner without a business proceeds from identity to business creation',async()=>{
 context={user:{id:'test-user',role:null},business:null};
 await assert.rejects(saveProfile({},profile()),/REDIRECT:\/mi-negocio\/nuevo/);
 assert.equal(calls[0].name,'guardar_perfil');
 assert.ok(!('rol' in calls[0].args));
});
test('a client cannot turn a profile edit into the owner onboarding flow',async()=>{
 context={user:{id:'test-user',role:'CLIENTE'},business:null};
 assert.ok((await saveProfile({},profile())).success);
 assert.deepEqual(cookieWrites,[]);
});
