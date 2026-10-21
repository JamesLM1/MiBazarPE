"use server";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getPrivateContext } from "@/features/dashboard/context";
export type AccessState = { error?: string; success?: string; token?: string };
const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function failure(message: string, code?: string): AccessState {
 const errors: Record<string,string> = {
  SESION_CONFIRMADA_REQUERIDA: "Inicia sesión con un correo confirmado para continuar.",
  ACCESO_DENEGADO: "Tu cuenta no tiene permiso para realizar esta acción.",
  CLIENTE_NO_HABILITADO: "El cliente debe estar activo, haber autorizado el registro de sus datos y no tener otra cuenta vinculada.",
  CORREO_NO_COINCIDE: "Utiliza el mismo correo guardado en la ficha del cliente.",
  DOCUMENTO_NO_COINCIDE: "El documento de tu perfil no coincide con el de la ficha del cliente. Solicita al bazar que lo revise.",
  INVITACION_INVALIDA: "La invitación venció, fue utilizada o corresponde a otro correo. Comprueba tu sesión o solicita un nuevo enlace.",
  COMPLETA_PERFIL: "Completa primero tu perfil y vuelve a aceptar esta invitación.",
  ESPERA_30_SEGUNDOS: "Espera 30 segundos antes de crear otra invitación.",
  DATOS_INVALIDOS: "Revisa los campos obligatorios y el formato de tus datos.",
 };
 return { error: Object.entries(errors).find(([key])=>message.includes(key))?.[1] ?? (code==='23505' ? "El documento, RUC o vínculo ya está registrado. Revisa los datos." : "No pudimos guardar los datos. Revisa los campos e inténtalo nuevamente.") };
}
export async function saveProfile(_: AccessState, form: FormData): Promise<AccessState> {
 const db=await getSupabaseServerClient();
 const name=value(form,"name"),type=value(form,"document_type"),document=value(form,"document"),phone=value(form,"phone");
 if(name.length<3 || name.length>120 || !["DNI","RUC"].includes(type) || !(type==='DNI'?/^\d{8}$/:/^\d{11}$/).test(document) || (phone&&!/^9\d{8}$/.test(phone))) return failure("DATOS_INVALIDOS");
 const {error}=await db.rpc("guardar_perfil",{p_nombre:name,p_tipo:type,p_documento:document,p_telefono:phone});
 if(error) return failure(error.message,error.code);
 revalidatePath("/", "layout");
 return {success:"Perfil guardado. Tu rol y tu documento se conservan cuando editas un perfil existente."};
}
export async function saveBusiness(_: AccessState, form: FormData): Promise<AccessState> {
 const context=await getPrivateContext(); const create=value(form,"create")==="yes";
 if(!create&&!context.business) return failure("ACCESO_DENEGADO");
 const db=await getSupabaseServerClient();
 const fields=["ruc","nombre","razon_social","direccion","telefono","correo","distrito","provincia","departamento"];
 const data:Record<string,string|boolean>=Object.fromEntries(fields.map(key=>[key,value(form,key)]));
 data.pagos_parciales=form.get("pagos_parciales")==="yes";
 const {error}=await db.rpc("guardar_bazar",{p_bazar:create?null:context.business?.id,p_datos:data});
 if(error) return failure(error.message,error.code);
 revalidatePath("/", "layout");
 return {success:create?"Negocio creado. Ya puedes seleccionarlo y registrar tus productos y clientes.":"Configuración del negocio actualizada."};
}
export async function createInvitation(_: AccessState, form: FormData): Promise<AccessState> {
 const context=await getPrivateContext();
 const type=value(form,"type"),client=value(form,"client"),business=value(form,"business") || context.business?.id;
 if(!business||!uuid.test(business)||!["CLIENTE","PROPIETARIO"].includes(type)||(type==='CLIENTE'&&!uuid.test(client))||(type==='PROPIETARIO'&&context.user.role!=='SUPERADMIN')) return failure("ACCESO_DENEGADO");
 const db=await getSupabaseServerClient();
 const {data,error}=await db.rpc("crear_invitacion",{p_bazar:business,p_cliente:client||null,p_correo:value(form,"email"),p_tipo:type});
 if(error) return failure(error.message,error.code);
 revalidatePath("/invitaciones");
 return {success:"Enlace creado. Vence en siete días y se puede utilizar una sola vez. Cópialo y compártelo con su destinatario.",token:String(data)};
}
export async function acceptInvitation(_: AccessState, form: FormData): Promise<AccessState> {
 const token=value(form,"token"); if(!/^[0-9a-f-]{72}$/i.test(token)) return failure("INVITACION_INVALIDA");
 const db=await getSupabaseServerClient();
 const {data,error}=await db.rpc("aceptar_invitacion",{p_token:token});
 if(error) return failure(error.message,error.code);
 revalidatePath("/", "layout");
 return {success:data==='CLIENTE'?"Tu cuenta ya está vinculada. Abre Mi cuenta cliente para consultar tus compras y cuotas.":"Ya tienes acceso como propietario. Abre el Dashboard para gestionar el negocio."};
}
export async function revokeInvitation(_: AccessState, form: FormData): Promise<AccessState> {
 const id=value(form,"id"); if(!uuid.test(id))return failure("DATOS_INVALIDOS");
 const db=await getSupabaseServerClient(); const {error}=await db.rpc("revocar_invitacion",{p_id:id});
 if(error)return failure(error.message,error.code);
 revalidatePath("/invitaciones"); return {success:"Invitación revocada."};
}
