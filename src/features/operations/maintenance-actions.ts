"use server";
import { customerFields, productFields, moneyInput } from "./catalog-validation";
import { revalidatePath } from "next/cache";
import { getPrivateContext } from "@/features/dashboard/context";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { AccessState } from "@/features/access/actions";
const value=(f:FormData,key:string)=>String(f.get(key)??'').trim();
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function access(){const context=await getPrivateContext();if(!context.business||(context.user.role!=='SUPERADMIN'&&context.business.role!=='PROPIETARIO'))return null;return {db:await getSupabaseServerClient(),bazar:context.business.id};}
const denied={error:'No tienes permiso para editar este registro.'};
function refresh(){revalidatePath('/', 'layout');}
export async function editCustomer(_:AccessState,f:FormData):Promise<AccessState>{
 const auth=await access();if(!auth)return denied;const id=value(f,'id'),state=value(f,'state'),credit=value(f,'credit_state');
 const fields=customerFields(f);if(fields.error||!fields.data)return {error:fields.error??'Revisa los datos del cliente.'};
 if(!uuid.test(id)||!['ACTIVO','INACTIVO'].includes(state)||!['AL_DIA','OBSERVADO_MORA','BLOQUEADO'].includes(credit))return {error:'Revisa los estados del cliente.'};
 const {data,error}=await auth.db.from('clientes').update({...fields.data,estado_registro:state,estado_crediticio:credit}).eq('id_bazar',auth.bazar).eq('id_cliente',id).select('id_cliente').maybeSingle();
 if(error||!data)return {error:'No pudimos guardar la ficha. Revisa tu acceso e inténtalo nuevamente.'};refresh();return {success:'Ficha actualizada. El historial de compras, cuotas y pagos se conserva.'};
}
export async function editProduct(_:AccessState,f:FormData):Promise<AccessState>{
 const auth=await access();if(!auth)return denied;const id=value(f,'id'),state=value(f,'state');
 const fields=productFields(f,true);if(fields.error||!fields.data)return {error:fields.error??'Revisa el producto.'};
 if(!uuid.test(id)||!['ACTIVO','INACTIVO'].includes(state))return {error:'Revisa el estado del producto.'};
 const {data,error}=await auth.db.from('productos').update({...fields.data,estado:state}).eq('id_bazar',auth.bazar).eq('id_producto',id).select('id_producto').maybeSingle();
 if(error||!data)return {error:'No pudimos guardar el producto. Revisa los valores.'};refresh();return {success:'Producto actualizado. Los precios históricos de las ventas se conservan.'};
}
function percentage(raw:string,max:number){if(!/^\d{1,3}(\.\d{1,10})?$/.test(raw)||Number(raw)<=0||Number(raw)>max)return null;const [whole,fraction='']=raw.split('.');const digits=whole.padStart(3,'0');return `${digits.slice(0,-2)}.${digits.slice(-2)}${fraction}`;}
export async function saveCreditTerms(_:AccessState,f:FormData):Promise<AccessState>{
 const auth=await access();if(!auth)return denied;const id=value(f,'id'),rate=percentage(value(f,'rate'),150),late=percentage(value(f,'late'),200),line=value(f,'line'),cut=Number(value(f,'cut')),pay=Number(value(f,'pay')),months=Number(value(f,'months')),type=value(f,'rate_type'),lateType=value(f,'late_type');
 if(!uuid.test(id)||!rate||!late||!moneyInput(line,10000)||Number(line)<50||Number(line)>10000||![cut,pay,months].every(Number.isInteger)||cut<1||cut>25||pay<cut+5||pay>30||months<1||months>12||!['TEA','TNA'].includes(type)||!['TEA','TNA'].includes(lateType))return {error:'Revisa línea, tasas, plazo y días. El pago debe ser al menos cinco días después del corte.'};
 const customer=await auth.db.from('clientes').select('id_cliente').eq('id_cliente',id).eq('id_bazar',auth.bazar).maybeSingle();if(customer.error||!customer.data)return denied;
 const rule=value(f,"monthly_rule");if(!["CORTE","PAGO"].includes(rule))return {error:"Selecciona hasta cuándo se calcula el interés de fin de mes."};
 const payload={regla_fin_mes:rule,linea_credito_max:line,tipo_tasa_compensatoria:type,tasa_compensatoria:rate,capitalizacion_compensatoria:type==='TNA'?value(f,'capitalization'):null,tipo_tasa_moratoria:lateType,tasa_moratoria:late,capitalizacion_moratoria:lateType==='TNA'?value(f,'late_capitalization'):null,dia_corte:cut,dia_pago:pay,plazo_maximo_meses:months,activo:f.get('active')==='yes'};
 const existing=await auth.db.from('configuraciones_credito').select('id_configuracion').eq('id_cliente',id).maybeSingle();if(existing.error)return {error:'No se pudo consultar la configuración.'};
 const {error}=existing.data?await auth.db.from('configuraciones_credito').update(payload).eq('id_cliente',id):await auth.db.from('configuraciones_credito').insert({...payload,id_cliente:id,moneda:'PEN'});
 if(error)return {error:'No se guardaron las condiciones. Revisa la capitalización y los valores permitidos.'};refresh();return {success:'Condiciones guardadas para futuras ventas. Los créditos existentes conservan sus tasas y cronogramas.'};
}
export async function closeMonth():Promise<AccessState>{const auth=await access();if(!auth)return denied;const {data,error}=await auth.db.rpc('liquidar_fin_mes',{p_bazar:auth.bazar});if(error)return {error:'No se pudo realizar la liquidación. Inténtalo nuevamente.'};refresh();return {success:`Se generaron ${Number(data)} liquidaciones nuevas. Los cortes ya liquidados no se duplican.`};}
export async function changeBusinessState(_:AccessState,f:FormData):Promise<AccessState>{
 const context=await getPrivateContext();if(context.user.role!=='SUPERADMIN')return denied;
 const id=value(f,'business'),state=value(f,'state');if(!uuid.test(id)||!['ACTIVO','BAJA','SUSPENDIDO'].includes(state))return {error:'Selecciona un negocio y un estado válidos.'};
 if(f.get('confirm')!=='yes')return {error:'Confirma que revisaste el efecto del cambio.'};
 const db=await getSupabaseServerClient();const {error}=await db.rpc('cambiar_estado_bazar',{p_bazar:id,p_estado:state});
 if(error)return {error:error.message.includes('OBLIGACIONES_PENDIENTES')?'El negocio tiene cuentas pendientes de cobro o pago. Debe liquidarlas antes de darlo de baja.':'No se pudo cambiar el estado del negocio.'};
 refresh();return {success:'Estado actualizado. El historial se conserva.'};
}
