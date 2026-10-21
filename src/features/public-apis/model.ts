export type ProductSuggestion = { barcode:string; name:string; brand:string; category:string; description:string; image:string|null; source:string };
export type ExchangeRates = { base:string; rates:Record<string,number>; updated:string; nextUpdate:string };
export const CURRENCIES = ["PEN","USD","EUR"] as const;
export function record(value:unknown):Record<string,unknown> { return value && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {}; }
export function text(value:unknown,max=250):string { return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):''; }
export function barcodeValue(value:unknown):string {
 const code=text(value,30).replace(/[ -]/g,'');
 if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code))throw new Error('Introduce un código de barras de 8, 12, 13 o 14 dígitos.');
 return code;
}
export function productSuggestion(raw:unknown,barcode:string):ProductSuggestion|null {
 const data=record(raw),p=record(data.product);
 if(data.status===0 || !Object.keys(p).length)return null;
 const name=text(p.product_name_es||p.product_name||p.generic_name,100);
 if(!name)return null;
 let image:string|null=null;
 try { const url=new URL(String(p.image_front_small_url||p.image_front_url||'')); if(url.protocol==='https:' && url.hostname==='images.openfoodfacts.org')image=url.href; }catch{}
 return {barcode,name,brand:text(p.brands,80),category:text(p.categories,50),description:text(p.quantity,250),image,source:`https://world.openfoodfacts.org/product/${barcode}`};
}
export function exchangeRates(raw:unknown,base:string,now=Date.now()):ExchangeRates {
 const data=record(raw),rates=record(data.rates),updated=Number(data.time_last_update_unix)*1000,next=Number(data.time_next_update_unix)*1000;
 if(data.result!=='success'||data.base_code!==base||!Number.isFinite(updated)||!Number.isFinite(next)||updated>now+600000||now-updated>172800000)throw new Error('La fuente de monedas no devolvió una cotización vigente.');
 const result:Record<string,number>={};
 for(const currency of CURRENCIES){const n=rates[currency];if(typeof n!=='number'||!Number.isFinite(n)||n<=0)throw new Error('La cotización está incompleta.');result[currency]=n;}
 return {base,rates:result,updated:new Date(updated).toISOString(),nextUpdate:new Date(next).toISOString()};
}
export type DemoProduct={id:number;name:string;category:string;brand:string;description:string;image:string|null;price:number};
export function demoProducts(raw:unknown):DemoProduct[]{
 const products=record(raw).products;
 if(!Array.isArray(products))throw new Error('No se pudo leer el catálogo de prueba.');
 return products.slice(0,12).map(record).filter(p=>Number.isInteger(p.id)&&text(p.title)).map(p=>{
  let image:string|null=null;try{const u=new URL(String(p.thumbnail));if(u.protocol==='https:'&&u.hostname==='cdn.dummyjson.com')image=u.href;}catch{}
  return {id:Number(p.id),name:text(p.title,100),brand:text(p.brand,80),category:text(p.category,50),description:text(p.description),image,price:typeof p.price==='number'&&Number.isFinite(p.price)&&p.price>0?p.price:0};
 });
}
export function publicUrl(value:unknown):string {
 if(typeof value!=='string'||value.length>500)throw new Error('Introduce una dirección pública válida.');
 let u:URL;try{u=new URL(value);}catch{throw new Error('Introduce una dirección pública completa con https://.');}
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.hostname==='localhost'||u.hostname.endsWith('.localhost')||u.hostname.endsWith('.local')||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':'))throw new Error('Usa una URL pública HTTPS, sin contraseñas, parámetros ni enlaces privados.');
 return u.href;
}
export function ocrFileType(bytes:Uint8Array):string|null {
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return 'image/png';
 if(String.fromCharCode(...bytes.slice(0,5))==='%PDF-')return 'application/pdf';
 return null;
}
export function receiptText(raw:unknown):string {
 const data=record(raw),pages=data.ParsedResults;
 if(data.IsErroredOnProcessing===true||!Array.isArray(pages)||!pages.length)throw new Error('No se pudo leer el documento completo. Prueba una imagen más clara o un PDF de hasta 3 páginas.');
 if(pages.length>3||pages.some(p=>record(p).FileParseExitCode!==1))throw new Error('El documento no se leyó completamente. Divide el PDF o prueba una imagen más clara.');
 const result=pages.map(p=>typeof record(p).ParsedText==='string'?record(p).ParsedText as string:'').join('\n\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim();
 if(!result)throw new Error('No se encontró texto legible. Prueba una fotografía más clara.');
 if(result.length>40000)throw new Error('El texto es demasiado extenso. Divide el documento.');
 return result;
}
