import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { after,beforeEach,mock,test } from 'node:test';
const root = new URL('../src/features/bazi/',import.meta.url);
const modelUrl = new URL('model.ts',root).href;
const dataUrl = new URL('data.ts',root).href;
const geminiUrl = new URL('gemini.ts',root).href;
const operationsUrl = new URL('../src/features/operations/actions.ts',import.meta.url).href;
const persistenceUrl = new URL('persistence.ts',root).href;
const hooks=registerHooks({resolve(specifier,context,next){
  if(specifier==='server-only')return {url:'data:text/javascript,export {};',shortCircuit:true};
  if(specifier==='next/cache'||specifier==='next/navigation')return next(specifier+'.js',context);
  if(specifier==='@/features/operations/actions')return {url:operationsUrl,shortCircuit:true};
  if(context.parentURL?.includes('/features/bazi/')&&specifier.startsWith('./')&&!specifier.endsWith('.ts'))return {url:new URL(specifier+'.ts',root).href,shortCircuit:true};
  return next(specifier,context);
}});
let auth, providerCall, providerResult, saleCalls, updates, filters, conflict, rpcCalls, memoryWrites;
let testClock=Date.now();mock.method(Date,'now',()=>testClock);
const productId='11111111-1111-4111-8111-111111111111';
const product={id_producto:productId,nombre:'Cuaderno',precio_contado:'2.00',precio_credito:'5.00',stock_minimo:5,updated_at:'2026-10-21T10:00:00Z'};
const db={rpc:async(name,args)=>{rpcCalls.push({name,args});return {data:args.p_key,error:null};},from(table){const builder={select(){return builder;},eq(k,v){filters.push([table,k,v]);return builder;},update(payload){updates.push(payload);return builder;},upsert:async(payload)=>{memoryWrites.push({table,payload});return {data:null,error:null};},maybeSingle:async()=>({data:updates.length?(conflict?null:{id_producto:productId}):product,error:null})};return builder;}};
mock.module('next/cache.js',{exports:{revalidatePath(){}}});
mock.module('next/navigation.js',{exports:{unstable_rethrow(){}}});
mock.module(dataUrl,{exports:{getBaziContext:async()=>auth,directReply:async()=>({text:'scoped',cards:[],proposals:[],source:'direct'})}});
mock.module(persistenceUrl,{exports:{approvedMemory:async()=>[{title:'Contexto revisado',content:'Texto de ejemplo'}],resources:async()=>({routines:[],memories:[],runs:[]})}});
mock.module(geminiUrl,{exports:{geminiConfiguration:()=>({key:'private-key',model:'model'}),askGemini:async options=>{providerResult=await providerCall(options);return 'Propuesta pendiente de revisión.';}}});
mock.module(operationsUrl,{exports:{registerSale:async(previous,form)=>{saleCalls.push({previous,intent:form.get('intent'),key:form.get('key')});return form.get('intent')==='preview'?{error:null,success:null,preview:{total:'2.00',moneda:'PEN',modalidad:'CONTADO',cuotas:[]}}:{error:null,success:'Venta registrada.'};}}});
const {requestBazi,confirmBaziProposal}=await import('../src/features/bazi/actions.ts');
const {signProposal}=await import(modelUrl);
beforeEach(()=>{testClock+=61000;auth={context:{user:{id:'owner',role:'DUENO_BAZAR'}},scope:'scope-a',businessId:'business-a',businessName:'A',clientId:null,isClient:false,canManage:true,db};providerCall=async()=>({});providerResult=null;saleCalls=[];updates=[];filters=[];conflict=false;rpcCalls=[];memoryWrites=[];});
after(()=>hooks.deregister());
test('Bazi actions: contexto distinto se rechaza antes del proveedor',async()=>{
  providerCall=()=>{throw Error('provider must not run');};
  const result=await requestBazi({scope:'scope-b',message:'hola',shareWithGemini:true});assert.equal(result.error,'CONTEXT_CHANGED');
});
test('Bazi actions: cliente no recibe herramientas comerciales ni puede confirmar',async()=>{
  auth.isClient=true;auth.canManage=false;auth.context.user.role='CLIENTE';
  providerCall=async options=>{assert.deepEqual(options.tools.map(t=>t.name),['consultar_cuenta','consultar_rutinas','preparar_rutina']);return {};};
  await requestBazi({scope:'scope-a',message:'hola',shareWithGemini:true});
  const result=await confirmBaziProposal('forged');assert.ok(result.error);assert.equal(updates.length,0);
});
test('Bazi actions: no se llama al modelo sin autorización de envío',async()=>{
  providerCall=()=>{throw Error('provider must not run');};
  const result=await requestBazi({scope:'scope-a',message:'resumen',shareWithGemini:false});assert.equal(result.error,'CONSENT_REQUIRED');
});
test('Bazi actions: propuesta de precio no escribe y no comparte su token con Gemini',async()=>{
  providerCall=options=>options.run('proponer_cambio_producto',{producto_id:productId,campo:'precio_contado',valor:'3.50'});
  const result=await requestBazi({scope:'scope-a',message:'cambia el precio',shareWithGemini:true});
  assert.equal(updates.length,0);assert.equal(result.proposals.length,1);assert.equal('token' in providerResult.proposals[0],false);
  const saved=await confirmBaziProposal(result.proposals[0].token);
  assert.ok(saved.success);assert.equal(updates.length,1);assert.equal(updates[0].precio_contado,'3.50');assert.equal('stock_actual' in updates[0],false);
  for(const key of ['id_bazar','id_producto','precio_contado','precio_credito','stock_minimo','updated_at'])assert.ok(filters.some(f=>f[1]===key));
});
test('Bazi actions: conflicto y propuesta de otro negocio no guardan',async()=>{
  conflict=true;
  const token=signProposal({kind:'product',user:'owner',business:'business-a',product:productId,field:'precio_contado',value:'3.00',before:{cash:'2.00',credit:'5.00',minimum:5,name:'Cuaderno',updated:product.updated_at}});
  assert.match((await confirmBaziProposal(token)).error,/cambió/);
  updates=[];auth.businessId='business-b';assert.ok((await confirmBaziProposal(token)).error);assert.equal(updates.length,0);
});
test('Bazi actions: venta usa previsualización y solo confirma fuera del bucle del modelo',async()=>{
  providerCall=options=>options.run('preparar_venta',{cliente_id:'',modalidad:'CONTADO',cuotas:2,gracia:0,items:[{producto_id:productId,cantidad:1}]});
  const result=await requestBazi({scope:'scope-a',message:'prepara una venta',shareWithGemini:true});
  assert.equal(saleCalls.length,1);assert.equal(saleCalls[0].intent,'preview');assert.equal(result.proposals.length,1);
  assert.ok((await confirmBaziProposal(result.proposals[0].token)).success);assert.equal(saleCalls[1].intent,'confirm');assert.equal(saleCalls[1].key,saleCalls[0].key);assert.equal(saleCalls[1].previous.preview.total,'2.00');
});

test('Bazi actions: conserva una propuesta sin guardar si el proveedor interrumpe la explicación',async()=>{
  providerCall=async options=>{await options.run('proponer_cambio_producto',{producto_id:productId,campo:'stock_minimo',valor:'6'});throw new Error('Gemini alcanzó su límite de uso.');};
  const result=await requestBazi({scope:'scope-a',message:'prepara el mínimo',shareWithGemini:true});
  assert.equal(result.source,'gemini');assert.equal(result.error,'REQUEST_FAILED');assert.equal(result.proposals.length,1);assert.equal(updates.length,0);assert.match(result.text,/sin confirmar/);
});

test('Bazi actions: programar una rutina requiere propuesta y confirma con la misma clave idempotente',async()=>{
  providerCall=options=>options.run('preparar_rutina',{titulo:'Revisar stock',tipo:'STOCK',frecuencia:'DIARIA',dia:1,hora:'09:00'});
  const result=await requestBazi({scope:'scope-a',message:'programar',shareWithGemini:true});
  assert.equal(result.proposals.length,1);assert.equal(rpcCalls.length,0);
  assert.ok((await confirmBaziProposal(result.proposals[0].token)).success);
  assert.ok((await confirmBaziProposal(result.proposals[0].token)).success);
  assert.equal(rpcCalls.length,2);assert.equal(rpcCalls[0].name,'bazi_confirmar_rutina');assert.equal(rpcCalls[0].args.p_key,rpcCalls[1].args.p_key);assert.equal(rpcCalls[0].args.p_bazar,'business-a');
});

test('Bazi actions: el cliente solo prepara rutinas de su cuenta y nunca memoria compartida',async()=>{
  auth.isClient=true;auth.canManage=false;auth.context.user.role='CLIENTE';auth.clientId='client-a';
  providerCall=options=>options.run('preparar_rutina',{titulo:'Mis cuotas',tipo:'MI_CUENTA',frecuencia:'SEMANAL',dia:1,hora:'10:00'});
  const result=await requestBazi({scope:'scope-a',message:'mis cuotas',shareWithGemini:true});assert.equal(result.proposals.length,1);
  await confirmBaziProposal(result.proposals[0].token);assert.equal(rpcCalls[0].args.p_cliente,'client-a');assert.equal(rpcCalls[0].args.p_tipo,'MI_CUENTA');
  providerCall=options=>options.run('preparar_memoria',{titulo:'No autorizado',contenido:'No se debe guardar'});
  const denied=await requestBazi({scope:'scope-a',message:'recuerda',shareWithGemini:true});assert.equal(denied.proposals.length,0);assert.equal(memoryWrites.length,0);
});

test('Bazi actions: las notas se guardan solo al aprobar y conservan un ID estable en reintentos',async()=>{
  providerCall=options=>options.run('preparar_memoria',{titulo:'Reposición',contenido:'Priorizar productos agotados antes del stock bajo.'});
  const result=await requestBazi({scope:'scope-a',message:'recuerda',shareWithGemini:true});assert.equal(memoryWrites.length,0);
  await confirmBaziProposal(result.proposals[0].token);await confirmBaziProposal(result.proposals[0].token);
  assert.equal(memoryWrites.length,2);assert.equal(memoryWrites[0].payload.id,memoryWrites[1].payload.id);assert.equal(memoryWrites[0].payload.id_bazar,'business-a');
});
