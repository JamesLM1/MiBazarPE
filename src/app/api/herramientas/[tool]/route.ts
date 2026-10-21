import {getPrivateContext} from '@/features/dashboard/context';
import {loadModule} from '@/features/operations/module-data';
import {findProduct,ratesFor,sampleCatalog,readReceipt,chartImage,qrImage,barcodeImage,limitedResponse} from '@/features/public-apis/providers';
import {getSupabaseServerClient} from '@/infrastructure/supabase/server';
import {CURRENCIES,ocrFileType,record} from '@/features/public-apis/model';
export const runtime='nodejs';
const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const attempts=new Map<string,{count:number;until:number}>();
function limited(key:string,max:number,window:number){const now=Date.now();for(const[k,v]of attempts)if(v.until<=now)attempts.delete(k);if(attempts.size>2000&&!attempts.has(key))return true;const value=attempts.get(key)??{count:0,until:now+window};value.count++;attempts.set(key,value);return value.count>max;}
const reply=(data:object,status=200)=>Response.json(data,{status,headers:privateHeaders});
export async function POST(request:Request,{params}:{params:Promise<{tool:string}>}){
 const {tool}=await params;
 if(!['producto','monedas','comprobante','grafico','qr','etiqueta','muestra','estado'].includes(tool))return reply({error:'Herramienta no disponible.'},404);
 const origin=request.headers.get('origin');const requestOrigin=new URL(request.url).origin;
 const origins=new Set([requestOrigin]);try{if(process.env.MARKETING_PUBLIC_URL)origins.add(new URL(process.env.MARKETING_PUBLIC_URL).origin);}catch{}
 if(!origin||!origins.has(origin)||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Actualiza la página para usar esta herramienta.'},403);
 try{
  const context=await getPrivateContext();
  if(!context.business||!['DUENO_BAZAR','SUPERADMIN'].includes(context.user.role??'')||(context.business.role!=='PROPIETARIO'&&context.user.role!=='SUPERADMIN'))return reply({error:'Selecciona un negocio donde tengas permiso de propietario.'},403);
  if(limited(`${context.user.id}:all`,40,60000))return reply({error:'Hay varias consultas recientes. Espera un minuto.'},429);
  if(tool==='comprobante'){
   if(!process.env.OCR_SPACE_API_KEY)return reply({error:'La lectura de comprobantes está pendiente de activar con la clave gratuita de OCR.Space.'},503);
   if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return reply({error:'Adjunta una fotografía o un PDF.'},415);
   // Bound the incoming stream before FormData parsing; Content-Length alone is not trusted.
   const bytes=await limitedResponse(new Response(request.body),1100000);
   const form=await new Response(bytes as BodyInit,{headers:{'content-type':request.headers.get('content-type')!}}).formData();
   if(form.get('businessId')!==context.business.id)return reply({error:'El negocio cambió. Actualiza la página antes de enviar el documento.'},409);
   if(form.get('consent')!=='yes')return reply({error:'Confirma el envío de este documento a OCR.Space.'},400);
   const file=form.get('file');if(!(file instanceof File)||file.size===0||file.size>1000000)return reply({error:'Selecciona un archivo de hasta 1 MB.'},400);
   const type=ocrFileType(new Uint8Array(await file.arrayBuffer()));if(!type||file.type!==type)return reply({error:'Solo se admiten imágenes JPG/PNG y PDF válidos, de hasta 3 páginas.'},400);
   if(limited(`${context.user.id}:ocr`,10,86400000))return reply({error:'Alcanzaste el límite diario de 10 lecturas de comprobantes. Continúa con el registro manual.'},429);
   const output=await readReceipt(file);return reply({text:output});
  }
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Formato no admitido.'},415);
  let input:Record<string,unknown>;
  try{input=record(JSON.parse(new TextDecoder().decode(await limitedResponse(new Response(request.body),6000))));}catch{return reply({error:'La solicitud no es válida o supera el tamaño permitido.'},400);}
  if(input.businessId!==context.business.id)return reply({error:'El negocio cambió. Actualiza la página.'},409);
  if(tool==='estado')return reply({ocr:!!process.env.OCR_SPACE_API_KEY});
  if(tool==='producto')return reply({product:await findProduct(input.barcode)});
  if(tool==='monedas'){
   if(!CURRENCIES.includes(input.base as typeof CURRENCIES[number]))return reply({error:'Selecciona PEN, USD o EUR.'},400);
   return reply({rates:await ratesFor(String(input.base))});
  }
  if(tool==='muestra')return reply({products:await sampleCatalog()});
  if(tool==='etiqueta'){
   if(input.consent!==true)return reply({error:'Confirma el envío del SKU a QuickChart.'},400);
   if(typeof input.productId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.productId))return reply({error:'Producto no válido.'},400);
   const db=await getSupabaseServerClient();const result=await db.from('productos').select('codigo_sku').eq('id_bazar',context.business.id).eq('id_producto',input.productId).maybeSingle();
   if(result.error||!result.data)return reply({error:'El producto no está disponible en el negocio seleccionado.'},404);
   return new Response(await barcodeImage(result.data.codigo_sku) as BodyInit,{headers:{...privateHeaders,'Content-Type':'image/png','Content-Disposition':'attachment; filename="mibazarpe-etiqueta-sku.png"'}});
  }
  if(tool==='grafico'){
   if(input.consent!==true)return reply({error:'Confirma el envío de los totales mensuales a QuickChart.'},400);
   if(!CURRENCIES.includes(input.currency as typeof CURRENCIES[number]))return reply({error:'Moneda no admitida.'},400);
   const data=await loadModule('reportes',{page:String(Math.max(1,Math.min(100000,Number(input.page)||1))),q:typeof input.query==='string'?input.query.slice(0,80):''});
   if(data.error)return reply({error:'No se pudieron consultar los datos del reporte.'},503);
   const rows=(data.trend??[]).filter(row=>row.currency===input.currency);
   if(!rows.length)return reply({error:'No hay datos de esta moneda en la página del reporte.'},404);
   const chart={type:'bar',data:{labels:rows.map(r=>r.month),datasets:[{label:'Contado',data:rows.map(r=>r.cash),backgroundColor:'#7fa9bc'},{label:'Crédito',data:rows.map(r=>r.credit),backgroundColor:'#0784ff'}]},options:{plugins:{title:{display:true,text:`Ventas mensuales (${input.currency}) · Página ${data.page}`}},scales:{x:{stacked:true},y:{stacked:true,beginAtZero:true}}}};
   return new Response(await chartImage(chart) as BodyInit,{headers:{...privateHeaders,'Content-Type':'image/png','Content-Disposition':'attachment; filename="mibazarpe-reporte.png"'}});
  }
  if(input.consent!==true)return reply({error:'Confirma el envío de la URL pública a QuickChart.'},400);
  return new Response(await qrImage(input.url) as BodyInit,{headers:{...privateHeaders,'Content-Type':'image/png','Content-Disposition':'attachment; filename="mibazarpe-qr.png"'}});
 }catch(error){
  const message=error instanceof Error?error.message:'';
  if(message.startsWith('NEXT_REDIRECT'))return reply({error:'Tu sesión venció. Inicia sesión de nuevo.'},401);
  const safe=/^(Introduce|Usa una URL|Espera unos|El proveedor|El SKU|La fuente|La cotización|La lectura|No se pudo|No se encontró|El documento|El texto|La respuesta)/.test(message);
  return reply({error:safe?message:'No pudimos completar la consulta. Inténtalo más tarde; puedes continuar con el registro manual.'},502);
 }
}
