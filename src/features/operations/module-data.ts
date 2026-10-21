import "server-only";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getPrivateContext } from "@/features/dashboard/context";


export type ModuleKind = "ventas" | "clientes" | "inventario" | "creditos" | "pagos" | "compras" | "caja" | "cuentas-por-cobrar" | "cuentas-por-pagar" | "reportes";
type RecordRow = Record<string, unknown>;
type Field = { label: string; key: string; format?: "money" | "date" | "percent" | "customer" | "product" | "boolean" };
type Definition = { title: string; description: string; table: string; order: string; fields: Field[] };
export type ModuleRow = { id: string; cells: string[]; details: { label: string; value: string }[]; search: string; href?:string };
export type ModuleData = { title: string; description: string; columns: string[]; rows: ModuleRow[]; summary: { label: string; value: string }[]; business: string | null; isDemo: boolean; error: string | null; limited: boolean; page:number; count:number; query:string; trend?: {month:string;cash:number;credit:number;currency:string}[] };

const definitions: Record<ModuleKind, Definition> = {
  ventas: { title: "Ventas", description: "Operaciones al contado, a fin de mes y en cuotas.", table: "ventas", order: "fecha", fields: [{ label: "Fecha", key: "fecha", format: "date" }, { label: "Cliente", key: "id_cliente", format: "customer" }, { label: "Modalidad", key: "modalidad" }, { label: "Total", key: "total", format: "money" }, { label: "Estado", key: "estado" }] },
  clientes: { title: "Clientes", description: "Registro, contacto, línea disponible y deuda de cada cliente.", table: "clientes", order: "nombre_completo", fields: [{ label: "Cliente", key: "nombre_completo" }, { label: "Documento", key: "numero_documento" }, { label: "Registro", key: "estado_registro" }, { label: "Crédito", key: "estado_crediticio" }, { label: "Línea", key: "linea_credito_max", format: "money" }, { label: "Disponible", key: "saldo_disponible", format: "money" }, { label: "Deuda", key: "deuda_total", format: "money" }] },
  inventario: { title: "Inventario", description: "Catálogo, precios, existencias y alertas de reposición.", table: "productos", order: "nombre", fields: [{ label: "SKU", key: "codigo_sku" }, { label: "Producto", key: "nombre" }, { label: "Categoría", key: "categoria" }, { label: "Contado", key: "precio_contado", format: "money" }, { label: "Crédito", key: "precio_credito", format: "money" }, { label: "Stock", key: "stock_actual" }, { label: "Mínimo", key: "stock_minimo" }] },
  creditos: { title: "Créditos", description: "Obligaciones, tasas, gracia y cronogramas financieros.", table: "creditos", order: "created_at", fields: [{ label: "Cliente", key: "id_cliente", format: "customer" }, { label: "Modalidad", key: "modalidad" }, { label: "Capital", key: "capital_original", format: "money" }, { label: "Cuotas", key: "numero_cuotas" }, { label: "TEM", key: "tasa_mensual", format: "percent" }, { label: "Próximo vencimiento", key: "proximo_vencimiento", format: "date" }, { label: "Saldo", key: "saldo_pendiente", format: "money" }] },
  pagos: { title: "Pagos y cobros", description: "Cobros registrados y aplicación a cuotas.", table: "pagos", order: "fecha", fields: [{ label: "Fecha", key: "fecha", format: "date" }, { label: "Cliente", key: "id_cliente", format: "customer" }, { label: "Monto", key: "monto", format: "money" }, { label: "Medio", key: "medio" }] },
  compras: { title: "Compras", description: "Abastecimiento y obligaciones con proveedores.", table: "compras", order: "fecha", fields: [{ label: "Fecha", key: "fecha", format: "date" }, { label: "Proveedor", key: "proveedor" }, { label: "Modalidad", key: "modalidad" }, { label: "Total", key: "total", format: "money" }, { label: "Vence", key: "vencimiento", format: "date" }] },
  caja: { title: "Caja", description: "Ingresos y egresos vinculados a las operaciones.", table: "movimientos_caja", order: "fecha", fields: [{ label: "Fecha", key: "fecha", format: "date" }, { label: "Tipo", key: "tipo" }, { label: "Concepto", key: "concepto" }, { label: "Monto", key: "monto", format: "money" }, { label: "Moneda", key: "moneda" }] },
  "cuentas-por-cobrar": { title: "Cuentas por cobrar", description: "Cuotas pendientes, interés, mora y vencimientos.", table: "cuentas_por_cobrar", order: "vencimiento", fields: [{ label: "Vence", key: "vencimiento", format: "date" }, { label: "Cliente", key: "id_cliente", format: "customer" }, { label: "Modalidad", key: "modalidad" }, { label: "Cuota", key: "numero" }, { label: "Capital", key: "capital_pendiente", format: "money" }, { label: "Interés", key: "interes_pendiente", format: "money" }, { label: "Mora", key: "mora_pendiente", format: "money" }, { label: "Saldo", key: "saldo", format: "money" }, { label: "Estado", key: "estado_visual" }] },
  "cuentas-por-pagar": { title: "Cuentas por pagar", description: "Compromisos pendientes con proveedores.", table: "cuentas_por_pagar", order: "vencimiento", fields: [{ label: "Vence", key: "vencimiento", format: "date" }, { label: "Proveedor", key: "proveedor" }, { label: "Total", key: "total", format: "money" }, { label: "Pagado", key: "pagado", format: "money" }, { label: "Saldo", key: "saldo", format: "money" }, { label: "Estado", key: "estado_visual" }] },
  reportes: { title: "Reportes", description: "Evolución mensual de ventas y composición contado/crédito.", table: "ventas", order: "fecha", fields: [] },
};
function str(value: unknown): string { return value === null || value === undefined || value === "" ? "—" : String(value); }
function number(value: unknown): number { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function date(value: unknown): string {
  const text = str(value);
  if (text === "—") return text;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.slice(8, 10) + "/" + text.slice(5, 7) + "/" + text.slice(0, 4);
  const parsed = new Date(text);
  return Number.isNaN(parsed.valueOf()) ? "—" : new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "2-digit", month: "2-digit", year: "numeric" }).format(parsed);
}
function by(rows: RecordRow[], key: string): Map<string, RecordRow[]> {
  const result = new Map<string, RecordRow[]>();
  for (const item of rows) { const id = str(item[key]); result.set(id, [...(result.get(id) ?? []), item]); }
  return result;
}
function modelRow(id: string, cells: string[], details: { label: string; value: string }[] = []): ModuleRow {
  return { id, cells, details, search: cells.concat(details.map(item => item.value)).join(" ").toLocaleLowerCase("es-PE") };
}

export type ModuleQuery = { page?:string; q?:string };
const identity:Record<ModuleKind,string>={ventas:'id_venta',clientes:'id_cliente',inventario:'id_producto',creditos:'id_credito',pagos:'id_pago',compras:'id_compra',caja:'id_movimiento','cuentas-por-cobrar':'id_cuota','cuentas-por-pagar':'id_compra',reportes:'mes'};
export async function loadModule(kind: ModuleKind,query:ModuleQuery={}): Promise<ModuleData> {
 const context=await getPrivateContext(),definition=definitions[kind];
 const page=Math.max(1,Math.min(100000,Math.floor(Number(query.page)||1))),term=(query.q??'').slice(0,80).replace(/[^\p{L}\p{N} @._-]/gu,'').trim();
 const empty:ModuleData={title:definition.title,description:definition.description,columns:definition.fields.map(f=>f.label),rows:[],summary:[],business:context.business?.name??null,isDemo:false,error:context.notice,limited:false,page,count:0,query:term};
 if(!context.business)return empty;
 const db=await getSupabaseServerClient(),bazar=context.business.id;
 const moneyIn=(v:unknown,c:unknown='PEN')=>new Intl.NumberFormat('es-PE',{style:'currency',currency:c==='USD'?'USD':'PEN'}).format(number(v));
 async function related(table:string,key:string,ids:string[],order:string,asc=true):Promise<RecordRow[]>{
  if(!ids.length)return [];const result:RecordRow[]=[];
  for(let offset=0;;offset+=500){const r=await db.from(table).select('*').eq('id_bazar',bazar).in(key,ids).order(order,{ascending:asc}).range(offset,offset+499);if(r.error)throw r.error;result.push(...r.data);if(r.data.length<500)break;}return result;
 }
 try{
  const searchView:Partial<Record<ModuleKind,string>>={ventas:'ventas_busqueda',creditos:'creditos_busqueda',pagos:'pagos_busqueda','cuentas-por-cobrar':'cobros_busqueda'};
  let request=db.from(kind==='reportes'?'reportes_ventas_mensuales':searchView[kind]??definition.table).select('*',{count:'exact'}).eq('id_bazar',bazar);
  if(kind==='cuentas-por-cobrar'||kind==='cuentas-por-pagar')request=request.gt('saldo',0);
  if(term){
   const fields:Record<ModuleKind,string[]>={ventas:['modalidad'],clientes:['nombre_completo','numero_documento','correo'],inventario:['nombre','codigo_sku','categoria'],creditos:['modalidad'],pagos:['medio'],compras:['proveedor','modalidad'],caja:['concepto','tipo'],'cuentas-por-cobrar':['modalidad'],'cuentas-por-pagar':['proveedor'],reportes:['mes']};
   const filters=fields[kind].map(f=>`${f}.ilike.%${term}%`);
   if(['ventas','creditos','pagos','cuentas-por-cobrar'].includes(kind)){
    filters.push(`nombre_cliente.ilike.%${term}%`);
   }request=request.or(filters.join(','));
  }
  const order=kind==='reportes'?'mes':definition.order;
  request=request.order(order,{ascending:['clientes','inventario','cuentas-por-cobrar','cuentas-por-pagar'].includes(kind)});
  if(order!==identity[kind])request=request.order(identity[kind]);
  const [mainResponse,aggregate,business]=await Promise.all([request.range((page-1)*20,page*20-1),db.rpc('resumen_modulo',{p_bazar:bazar,p_modulo:kind}),db.from('bazares').select('id_lote_demo').eq('id_bazar',bazar).single()]);
  if(mainResponse.error||aggregate.error||business.error)throw new Error('Consulta incompleta');
  const main=mainResponse.data as RecordRow[],totals=aggregate.data as {counts:Record<string,number>;amounts:{label:string;currency:string;amount:string}[]};
  const result:ModuleData={...empty,isDemo:Boolean(business.data.id_lote_demo),error:null,count:mainResponse.count??0,summary:[...Object.entries(totals.counts).map(([label,value])=>({label,value:String(value)})),...totals.amounts.map(v=>({label:`${v.label} (${v.currency})`,value:moneyIn(v.amount,v.currency)}))]};
  if(kind==='reportes'){
   result.trend=main.map(r=>({month:str(r.mes),cash:number(r.contado),credit:number(r.credito),currency:str(r.moneda)})).sort((a,b)=>a.month.localeCompare(b.month));
   result.columns=['Mes','Moneda','Ventas','Total','Contado','Crédito'];result.rows=main.map(r=>modelRow(`${r.mes}-${r.moneda}`,[str(r.mes),str(r.moneda),str(r.operaciones),moneyIn(r.total,r.moneda),moneyIn(r.contado,r.moneda),moneyIn(r.credito,r.moneda)]));return result;
  }
  const ids=main.map(r=>str(r[identity[kind]]));
  const detailsSource:Partial<Record<ModuleKind,[string,string,string]>>={ventas:['detalle_ventas','id_venta','id_detalle'],compras:['detalle_compras','id_compra','id_detalle'],creditos:['cuotas','id_credito','numero'],pagos:['aplicaciones_pago','id_pago','id_aplicacion']};
  const source=detailsSource[kind];
  // Stable foreign-key ordering avoids silently dropping detail lines after 1000 records.
  const detailRows=source?await related(source[0],source[1],ids,source[2]):[];
  const clientIds=[...new Set(main.map(r=>str(r.id_cliente)).filter(id=>id!=='—'))];
  const productIds=[...new Set(detailRows.map(r=>str(r.id_producto)).filter(id=>id!=='—'))];
  const [clients,products,accounts,balances]=await Promise.all([
   related('clientes','id_cliente',clientIds,'id_cliente'),related('productos','id_producto',productIds,'id_producto'),
   kind==='clientes'?related('cuentas_corrientes','id_cliente',ids,'id_cliente'):Promise.resolve([]),
   kind==='creditos'?related('cuentas_por_cobrar','id_credito',ids,'vencimiento'):Promise.resolve([]),
  ]);
  const names=new Map(clients.map(r=>[str(r.id_cliente),str(r.nombre_completo)])),productNames=new Map(products.map(r=>[str(r.id_producto),str(r.nombre)]));
  const accountMap=by(accounts,'id_cliente'),balanceMap=by(balances,'id_credito'),detailMap=source?by(detailRows,source[1]):new Map<string,RecordRow[]>();
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  for(const r of main){
   if(kind==='clientes'){const a=accountMap.get(str(r.id_cliente))?.[0];if(a)Object.assign(r,a);}
   if(kind==='creditos'){const pending=(balanceMap.get(str(r.id_credito))??[]).filter(q=>number(q.saldo)>0);Object.assign(r,{saldo_pendiente:pending.reduce((s,q)=>s+number(q.saldo),0),proximo_vencimiento:pending[0]?.vencimiento});}
   if(kind==='cuentas-por-cobrar'||kind==='cuentas-por-pagar')r.estado_visual=str(r.vencimiento)<today?'Vencida':'Pendiente';
  }
  result.rows=main.map(r=>{
   const id=str(r[identity[kind]]),related=detailMap.get(id)??[],details:{label:string;value:string}[]=[];
   if(kind==='ventas'||kind==='compras')details.push({label:'Productos',value:related.map(d=>`${productNames.get(str(d.id_producto))??'Producto'} × ${d.cantidad} = ${moneyIn(d.subtotal,r.moneda)}`).join(' · ')||'Sin detalle'});
   if(kind==='creditos'){related.sort((a,b)=>number(a.numero)-number(b.numero));details.push({label:'Cronograma',value:related.map(q=>`Cuota ${q.numero} · ${date(q.vencimiento)} · ${moneyIn(q.importe,r.moneda)} (interés ${moneyIn(q.interes,r.moneda)})`).join(' | ')},{label:'Gracia y corte',value:`${r.dias_gracia} días · ${date(r.fecha_corte)}`});}
   if(kind==='pagos')details.push({label:'Aplicación',value:related.map(d=>`Mora ${moneyIn(d.mora,r.moneda)} · Interés ${moneyIn(d.interes,r.moneda)} · Capital ${moneyIn(d.capital,r.moneda)}`).join(' | ')});
   if(kind==='clientes')details.push({label:'Contacto',value:`${str(r.correo)} · ${str(r.telefono)} · ${str(r.direccion)}`});
   if(kind==='inventario')details.push({label:'Modalidades',value:`Fin de mes: ${r.permite_fin_mes?'Sí':'No'} · Cuotas: ${r.permite_cuotas?'Sí':'No'}`});
   const cells=definition.fields.map(f=>{const v=r[f.key];if(f.format==='money')return v==null?'—':moneyIn(v,r.moneda);if(f.format==='date')return date(v);if(f.format==='percent')return (number(v)*100).toFixed(7)+' %';if(f.format==='customer')return r.id_cliente?names.get(str(v))??'Cliente no disponible':'Sin cliente';return str(v);});
   return {...modelRow(id,cells,details),...(['clientes','inventario'].includes(kind)?{href:`/${kind}/${id}`}:{})};
  });return result;
 }catch{return {...empty,error:'No pudimos consultar este módulo. Comprueba tu acceso al bazar y vuelve a intentarlo.'};}
}
