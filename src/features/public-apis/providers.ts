import 'server-only';
import {barcodeValue,productSuggestion,exchangeRates,demoProducts,receiptText,publicUrl,type ProductSuggestion,type ExchangeRates,type DemoProduct} from './model';
const cache=new Map<string,{until:number;value:unknown}>();
const pending=new Map<string,Promise<unknown>>();
async function cached<T>(key:string,ttl:number,read:()=>Promise<T>):Promise<T>{
 const hit=cache.get(key);if(hit&&hit.until>Date.now())return hit.value as T;
 if(pending.has(key))return pending.get(key) as Promise<T>;
 const work=read().then(value=>{if(cache.size>=300)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+ttl,value});return value;}).finally(()=>pending.delete(key));pending.set(key,work);return work;
}
async function json(url:string,init:RequestInit={}):Promise<unknown>{
 const response=await fetch(url,{...init,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(response.status===429?'El proveedor alcanzó su límite temporal. Inténtalo más tarde.':'El proveedor no está disponible. Puedes seguir trabajando con el registro manual.');
 const body=await limitedResponse(response,2000000);return JSON.parse(new TextDecoder().decode(body)) as unknown;
}
export async function limitedResponse(response:Response,max:number):Promise<Uint8Array>{
 if(!response.body)throw new Error('Respuesta vacía.');const reader=response.body.getReader();let length=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw new Error('La respuesta supera el tamaño permitido.');}chunks.push(value);}}finally{reader.releaseLock();}
 const output=new Uint8Array(length);let offset=0;for(const part of chunks){output.set(part,offset);offset+=part.length;}return output;
}
let lastFoodRequest=0;
export async function findProduct(value:unknown):Promise<ProductSuggestion|null>{
 const barcode=barcodeValue(value);
 return cached(`food:${barcode}`,3600000,async()=>{
  // Shared IP throttle, in addition to authenticated user limits (15 product reads/minute at OFF).
  if(Date.now()-lastFoodRequest<4200)throw new Error('Espera unos segundos antes de consultar otro código.');lastFoodRequest=Date.now();
  const fields='product_name,product_name_es,brands,categories,quantity,image_front_small_url,image_front_url';
  const raw=await json(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`,{headers:{'User-Agent':`MiBazarPE/1.0 (${process.env.MARKETING_CONTACT_EMAIL||'contacto.mibazarpe@gmail.com'})`}});
  return productSuggestion(raw,barcode);
 });
}
export function ratesFor(base:string):Promise<ExchangeRates>{return cached(`rates:${base}`,3600000,async()=>exchangeRates(await json(`https://open.er-api.com/v6/latest/${base}`),base));}
export function sampleCatalog():Promise<DemoProduct[]>{return cached('dummy:grocery',3600000,async()=>demoProducts(await json('https://dummyjson.com/products/category/groceries?limit=8&select=id,title,brand,category,description,thumbnail,price')));}
export async function readReceipt(file:File):Promise<string>{
 const key=process.env.OCR_SPACE_API_KEY;if(!key)throw new Error('La lectura de comprobantes está pendiente de activar con la clave gratuita de OCR.Space.');
 const data=new FormData();data.set('file',file,'comprobante'+(file.type==='application/pdf'?'.pdf':file.type==='image/png'?'.png':'.jpg'));data.set('OCREngine','2');data.set('language','spa');data.set('isTable','true');data.set('detectOrientation','true');data.set('isOverlayRequired','false');data.set('isCreateSearchablePdf','false');
 return receiptText(await json('https://api.ocr.space/parse/image',{method:'POST',headers:{apikey:key},body:data}));
}
export async function chartImage(chart:object):Promise<Uint8Array>{
 const response=await fetch('https://quickchart.io/chart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:'4',format:'png',width:1000,height:550,backgroundColor:'white',chart}),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok||!response.headers.get('content-type')?.startsWith('image/png'))throw new Error('No se pudo generar la imagen. El reporte de la aplicación sigue disponible.');
 return limitedResponse(response,4000000);
}
export async function qrImage(value:unknown):Promise<Uint8Array>{
 const url=new URL('https://quickchart.io/qr');url.searchParams.set('text',publicUrl(value));url.searchParams.set('size','500');url.searchParams.set('margin','4');url.searchParams.set('format','png');
 const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok||!response.headers.get('content-type')?.startsWith('image/png'))throw new Error('No se pudo generar el QR. Inténtalo más tarde.');return limitedResponse(response,1000000);
}
export async function barcodeImage(sku:string):Promise<Uint8Array>{
 if(!/^[\x20-\x7e]{2,20}$/.test(sku))throw new Error('El SKU contiene caracteres no admitidos por la etiqueta Code 128.');
 const response=await fetch('https://quickchart.io/barcode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'code128',text:sku,format:'png',includeText:true,width:500,height:80,scale:2}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok||!response.headers.get('content-type')?.startsWith('image/png'))throw new Error('No se pudo generar la etiqueta de este SKU.');return limitedResponse(response,1000000);
}
