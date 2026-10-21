import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { productFields, customerFields, moneyInput } from '../src/features/operations/catalog-validation.ts';
import { normalizeProductPhoto, MAX_PHOTO_BYTES } from '../src/features/operations/product-image.ts';
const form = (patch={}) => { const f=new FormData(); for(const [k,v] of Object.entries({sku:'P-001',name:'Cuaderno',category:'Papelería',unit:'Unidad',cash_price:'12.50',credit_price:'15.00',minimum:'5',fin_mes:'yes',...patch})) f.set(k,v); return f; };
test('create and edit share actual schema limits and preserve exact decimal strings',()=>{
 assert.equal(productFields(form()).data.precio_contado,'12.50');
 for(const patch of [{sku:'a'.repeat(21)},{name:'a'.repeat(101)},{category:'a'.repeat(51)},{description:'a'.repeat(251)},{brand:'a'.repeat(81)},{supplier:'a'.repeat(121)},{unit:'Litros'},{minimum:''},{minimum:'1.1'},{fin_mes:'no'},{name:'evil\nname'},{cash_price:'1e2'},{credit_price:'0.999'},{credit_price:'12.49'}])assert.ok(productFields(form(patch)).error,JSON.stringify(patch));
 const edited=form({cash:'12.50',credit:'15.00',sku:''});assert.ok(productFields(edited,true).data);
});
test('customer validation rejects overlong values and preserves optional fields',()=>{
 const f=form({name:'Cliente nuevo',email:'USER@example.com',phone:'912345678',address:'Av. Ejemplo'});
 assert.equal(customerFields(f).data.correo,'user@example.com');
 for(const [key,value] of Object.entries({name:'a'.repeat(101),email:'a'.repeat(110)+'@example.com',phone:'812345678',address:'a'.repeat(251)})) {const g=form({name:'Cliente nuevo',[key]:value});assert.ok(customerFields(g).error);}
});
test('money never silently rounds or accepts exponent/blank/negative input',()=>{
 for(const raw of ['',' ','1e2','Infinity','NaN','-1','0','1.001','100000.01','1,50']) assert.equal(moneyInput(raw),null,raw);
 assert.equal(moneyInput('0.01'),'0.01'); assert.equal(moneyInput('100000.00'),'100000.00');
});
test('product photos are re-encoded, resized and stripped of metadata',async()=>{
 const original=await sharp({create:{width:2000,height:1000,channels:3,background:'#007bff'}}).jpeg().withMetadata().toBuffer();
 const result=await normalizeProductPhoto(new File([original],'photo.jpg',{type:'image/jpeg'}));
 const meta=await sharp(result).metadata();assert.equal(meta.format,'webp');assert.equal(meta.width,1280);assert.equal(meta.height,640);assert.equal(meta.exif,undefined);assert.equal(meta.icc,undefined);
});
test('product photos reject spoofing, SVG, truncation and oversized files',async()=>{
 await assert.rejects(normalizeProductPhoto(new File(['<svg/>'],'fake.png',{type:'image/png'})));
 await assert.rejects(normalizeProductPhoto(new File(['<svg/>'],'image.svg',{type:'image/svg+xml'})));
 await assert.rejects(normalizeProductPhoto(new File([new Uint8Array(MAX_PHOTO_BYTES+1)],'huge.jpg',{type:'image/jpeg'})));
 await assert.rejects(normalizeProductPhoto(new File([new Uint8Array([255,216,255,1])],'truncated.jpg',{type:'image/jpeg'})));
 const huge=await sharp({create:{width:5000,height:4000,channels:3,background:'#fff'}}).png().toBuffer();
 await assert.rejects(normalizeProductPhoto(new File([huge],'pixels.png',{type:'image/png'})));
});
