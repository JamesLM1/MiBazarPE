import assert from 'node:assert/strict';
import test from 'node:test';
import {detectHeader, isFinancialReport, missingColumns, suggestMapping, validateRows} from '../src/features/imports/model.ts';

test('titles and blank rows above a product table do not become column names',()=>{
 const rows=[['Catálogo de octubre'],[],['Precios en soles'],['SKU','Producto','Precio','Stock'],['QA01','Agenda',12.5,10]];
 const header=detectHeader(rows);
 assert.deepEqual(header,{index:3,kind:'productos'});
 const result=validateRows(rows.slice(header.index+1),suggestMapping(rows[header.index],header.kind),header.kind,'punto',header.index+2);
 assert.equal(result[0].sourceRow,5);assert.equal(result[0].errors.length,0);
});
test('customer sheets can be recognized independently of the previous product selection',()=>{
 assert.deepEqual(detectHeader([['Agenda'],['Nombres y apellidos','DNI','Correo'],['Ana Torres','00010001','ana@example.test']]),{index:1,kind:'clientes'});
});
test('unrecognized headers keep the selected import type instead of silently guessing products',()=>{
 assert.deepEqual(detectHeader([[],['A','B'],['uno','dos']],'clientes'),{index:1,kind:'clientes'});
 assert.deepEqual(missingColumns(suggestMapping(['A','B'],'clientes'),'clientes').map(field=>field.key),['nombre_completo','numero_documento']);
});
test('exported installment reports are identified even with accented or reformatted headings',()=>{
 assert.ok(isFinancialReport(['Vence','Cliente','Modalidad','Cuota','Capital','Interés','Mora','Saldo','Estado']));
 assert.ok(isFinancialReport(['Vencimiento','Capital pendiente','Interés pendiente','Saldo']));
 assert.ok(!isFinancialReport(['SKU','Producto','Precio','Stock']));
 assert.ok(!isFinancialReport(['Nombre completo','DNI','Correo','Saldo']));
 assert.ok(!isFinancialReport(['Capital','Interés']));
});
test('header recognition is bounded and ignores data rows as a source of guessed money or identity',()=>{
 assert.equal(detectHeader([['Título'],...Array.from({length:19},()=>[]),['SKU','Producto','Precio']]).index,0);
 assert.equal(detectHeader([['Producto'],['QA01','Agenda','12.50']],'clientes').kind,'clientes');
 assert.equal(missingColumns({codigo_sku:0,nombre:1,precio_contado:64},'productos')[0].key,'precio_contado');
});
