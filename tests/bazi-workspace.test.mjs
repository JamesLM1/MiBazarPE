import assert from 'node:assert/strict';
import {test} from 'node:test';
import {blankWorkspace,cleanWorkspace,routineInput,memoryInput} from '../src/features/bazi/workspace-model.ts';

test('Bazi historial: conserva datos recientes, separa preferencias y elimina tokens ejecutables',()=>{
 const base=blankWorkspace();base.external=true;base.threads[0].exchanges=Array.from({length:25},(_,i)=>({id:'m'+i,question:'Pregunta '+i,reply:{text:'Respuesta',source:'gemini',cards:[],proposals:[{id:'proposal',title:'Cambio',detail:'Revisar',token:'private-confirmation',changes:[]}]}}));base.states.proposal={status:'saving'};
 const result=cleanWorkspace(base);assert.equal(result.threads[0].exchanges.length,20);assert.equal(result.threads[0].exchanges[0].id,'m5');assert.equal(result.external,true);assert.equal(result.threads[0].exchanges[0].reply.proposals[0].token,'');assert.equal(result.states.proposal.status,'pending');
});
test('Bazi historial: no conserva enlaces externos o ejecutables ni roles de sistema',()=>{
 const base=blankWorkspace();base.threads[0].exchanges=[{id:'m',question:'q',reply:{text:'r',source:'system',cards:[{id:'c',kind:'note',links:[{href:'javascript:alert(1)',label:'Bad'},{href:'//evil.example',label:'Bad'},{href:'/inventario',label:'Inventario'}]}],proposals:[]}}];
 const result=cleanWorkspace(base);assert.equal(result.threads[0].exchanges[0].reply.source,'direct');assert.deepEqual(result.threads[0].exchanges[0].reply.cards[0].links,[{href:'/inventario',label:'Inventario'}]);
});
test('Bazi historial: entradas nulas, IDs desconocidos y contenido excesivo tienen límites',()=>{
 assert.equal(cleanWorkspace(null).threads[0].id,'initial');const base=blankWorkspace();base.current='another';base.activity=Array.from({length:100},(_,i)=>({id:'a'+i,title:'t',detail:'x'.repeat(3000),time:'now'}));
 const result=cleanWorkspace(base);assert.equal(result.current,'initial');assert.equal(result.activity.length,80);assert.equal(result.activity[0].detail.length,1500);
});
test('Bazi rutinas: valida hora, frecuencia y alcance propio del cliente',()=>{
 const value={title:'Mi rutina',kind:'STOCK',frequency:'DIARIA',day:1,time:'09:00'};assert.equal(routineInput(value,false).kind,'STOCK');assert.throws(()=>routineInput(value,true));assert.equal(routineInput({...value,kind:'MI_CUENTA'},true).kind,'MI_CUENTA');
 for(const patch of [{time:'24:00'},{time:'9:00'},{day:7},{frequency:'CADA_SEGUNDO'},{kind:'PAGAR'},{title:'a'}])assert.throws(()=>routineInput({...value,...patch},false));
});
test('Bazi memoria: limita las notas y no añade permisos a partir del contenido',()=>{
 assert.deepEqual(memoryInput({title:'  Contexto  ',content:'  Preferencia revisada  ',role:'SUPERADMIN'}),{id:undefined,title:'Contexto',content:'Preferencia revisada'});assert.throws(()=>memoryInput({title:'ab',content:'ok'}));assert.throws(()=>memoryInput({title:'Contexto',content:'x'.repeat(1801)}));
});
