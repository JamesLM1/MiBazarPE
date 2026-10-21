"use server";
import { customerFields, productFields, moneyInput } from "./catalog-validation";
import { revalidatePath } from "next/cache";
import { getPrivateContext } from "@/features/dashboard/context";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";

export type CreditPlan = { total: string; moneda: string; modalidad: string; regla_fin_mes?:string; capital_financiado?: string; tasa_mensual?: string; disponible?: string; cuotas: { numero: number; vencimiento: string; saldo_inicial: string; interes: string; capital: string; importe: string; saldo_final: string }[]; detalle?: { producto: string; cantidad: number; precio: string }[] };
export type OperationState = { error: string | null; success: string | null; preview?: CreditPlan; productId?: string };
export async function searchOperationOptions(kind:string,query:string):Promise<{options:{id:string;label:string}[];error?:string}>{
 if(!['clientes','sin_linea','productos','productos_compra','cuotas','proveedores','bazares'].includes(kind)||query.length>80)return {options:[],error:'Búsqueda inválida.'};
 const context=await getPrivateContext();if(!['SUPERADMIN','DUENO_BAZAR'].includes(context.user.role??''))return {options:[],error:'Acceso no autorizado.'};
 const db=await getSupabaseServerClient();const {data,error}=await db.rpc('buscar_opciones',{p_bazar:context.business?.id??null,p_tipo:kind,p_busqueda:query});
 return error?{options:[],error:'No se pudieron buscar las opciones. Vuelve a intentarlo.'}:{options:data??[]};
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function text(data: FormData, key: string): string { return String(data.get(key) ?? "").trim(); }
function positive(textValue: string, max: number): number | null {
  const validated = moneyInput(textValue, max);
  return validated === null ? null : Number(validated);
}
function percentageInput(raw: string, max: number): string | null {
  if (!/^\d{1,3}(\.\d{1,10})?$/.test(raw) || Number(raw) <= 0 || Number(raw) > max) return null;
  const [whole, fraction = ""] = raw.split("."); const digits = whole.padStart(3, "0");
  return `${digits.slice(0, -2)}.${digits.slice(-2)}${fraction}`;
}
function integer(textValue: string, min: number, max: number): number | null {
  const value = Number(textValue);
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}
function businessError(): OperationState { return { error: "No hay un bazar activo con permiso para registrar esta operación.", success: null }; }
function invalid(message: string): OperationState { return { error: message, success: null }; }
function dbError(message: string): OperationState {
  const labels: Record<string, string> = {
    STOCK_INSUFICIENTE: "No hay existencias suficientes o el producto no está disponible.",
    CLIENTE_NO_HABILITADO: "El cliente no está habilitado para crédito.",
    CLIENTE_EN_MORA: "El cliente tiene cuotas vencidas. Revisa su cuenta antes de vender a crédito.",
    LINEA_EXCEDIDA: "La venta supera la línea de crédito disponible.",
    CONFIGURACION_REQUERIDA: "Este cliente aún no tiene configuración de crédito.",
    MODALIDAD_NO_HABILITADA: "El producto no permite esa modalidad de crédito.",
    PAGO_EXCEDE_DEUDA: "El monto supera el saldo pendiente.",
    PAGO_PARCIAL_NO_PERMITIDO: "Este bazar requiere pagar la cuota completa.",
    ACCESO_DENEGADO: "Tu cuenta no tiene permiso para realizar esta operación.",
    PLAZO_INVALIDO: "El plazo supera la configuración del cliente. Revisa las cuotas y los días de gracia.",
    MONEDA_NO_COMPATIBLE: "El catálogo está expresado en soles. Configura la línea del cliente en PEN antes de vender.",
    REVISION_CAMBIO: "Las condiciones cambiaron desde la previsualización. Revisa el cronograma nuevamente antes de confirmar.",
  };
  const code = Object.keys(labels).find(key => message.includes(key));
  return invalid(code ? labels[code] : "No se pudo registrar la operación. Revisa los datos y vuelve a intentar.");
}
async function authorized() {
  const context = await getPrivateContext();
  if (!context.business || (context.business.role !== "PROPIETARIO" && context.user.role !== "SUPERADMIN")) return null;
  return context.business.id;
}
function refresh(...paths: string[]) { revalidatePath("/dashboard"); for (const path of paths) revalidatePath(path); }

export async function registerSale(previous: OperationState, form: FormData): Promise<OperationState> {
  const bazar = await authorized(); if (!bazar) return businessError();
  const key = text(form, "key"), customer = text(form, "customer"), mode = text(form, "mode");
  if (!UUID.test(key) || (customer && !UUID.test(customer)) || !["CONTADO", "FIN_DE_MES", "EN_CUOTAS"].includes(mode)) return invalid("Revisa cliente y modalidad.");
  const ids = form.getAll("product").map(String).filter(Boolean), quantities = form.getAll("quantity").map(String);
  if (!ids.length || ids.length !== quantities.length || new Set(ids).size !== ids.length) return invalid("Selecciona productos distintos.");
  const items = ids.map((id, index) => ({ id_producto: id, cantidad: integer(quantities[index], 1, 500) }));
  if (items.some(item => !UUID.test(item.id_producto) || item.cantidad === null)) return invalid("Revisa los productos y cantidades.");
  const installments = mode === "EN_CUOTAS" ? integer(text(form, "installments"), 2, 12) : 1;
  const grace = mode === "EN_CUOTAS" ? integer(text(form, "grace"), 0, 30) : 0;
  if (!installments || grace === null || (mode !== "CONTADO" && !customer)) return invalid("El crédito necesita cliente, plazo y gracia válidos.");
  const supabase = await getSupabaseServerClient();
  const args = { p_bazar: bazar, p_cliente: customer || null, p_items: items, p_modalidad: mode, p_cuotas: installments, p_gracia: grace };
  if (text(form, "intent") !== "confirm" || !previous.preview) {
    const { data, error } = await supabase.rpc("previsualizar_venta", args);
    if (error) return dbError(error.message);
    return { error: null, success: null, preview: data as CreditPlan };
  }
  const { error } = await supabase.rpc("confirmar_venta", { ...args, p_clave: key, p_revision: previous.preview });
  if (error) return dbError(error.message);
  refresh("/ventas", "/inventario", "/creditos", "/caja", "/cuentas-por-cobrar", "/reportes");
  return { error: null, success: "Venta registrada. El stock y, si corresponde, el cronograma se actualizaron." };
}

export async function simulateCredit(_: OperationState, form: FormData): Promise<OperationState> {
 const customer=text(form,"customer"), mode=text(form,"mode");
 const amount=positive(text(form,"amount"),10000), installments=mode==='EN_CUOTAS'?integer(text(form,"installments"),2,12):1, grace=mode==='EN_CUOTAS'?integer(text(form,"grace"),0,30):0;
 if(!UUID.test(customer)||amount===null||!installments||grace===null||!['FIN_DE_MES','EN_CUOTAS'].includes(mode))return invalid('Revisa el monto, la modalidad y el plazo.');
 const db=await getSupabaseServerClient();
 const {data,error}=await db.rpc('simular_credito',{p_cliente:customer,p_monto:amount,p_modalidad:mode,p_cuotas:installments,p_gracia:grace});
 return error?dbError(error.message):{error:null,success:null,preview:data as CreditPlan};
}

export async function registerPurchase(_: OperationState, form: FormData): Promise<OperationState> {
  const bazar = await authorized(); if (!bazar) return businessError();
  const key = text(form, "key"), supplier = text(form, "supplier"), mode = text(form, "mode"), due = text(form, "due");
  if (!UUID.test(key) || supplier.length < 2 || supplier.length > 120 || !["CONTADO", "CREDITO"].includes(mode) || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return invalid("Revisa proveedor, modalidad y vencimiento.");
  const ids = form.getAll("product").map(String).filter(Boolean), quantities = form.getAll("quantity").map(String), costs = form.getAll("cost").map(String);
  if (!ids.length || ids.length !== quantities.length || ids.length !== costs.length || new Set(ids).size !== ids.length) return invalid("Selecciona productos distintos.");
  const items = ids.map((id, index) => ({ id_producto: id, cantidad: integer(quantities[index], 1, 500), costo: positive(costs[index], 100000) }));
  if (items.some(item => !UUID.test(item.id_producto) || item.cantidad === null || item.costo === null)) return invalid("Revisa cantidades y costos de compra.");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("registrar_compra", { p_bazar: bazar, p_proveedor: supplier, p_items: items, p_modalidad: mode, p_vencimiento: due, p_clave: key });
  if (error) return dbError(error.message);
  refresh("/compras", "/inventario", "/caja", "/cuentas-por-pagar");
  return { error: null, success: "Compra registrada. El inventario y la cuenta del proveedor se actualizaron." };
}

export async function registerPayment(_: OperationState, form: FormData): Promise<OperationState> {
  const bazar = await authorized(); if (!bazar) return businessError();
  const key = text(form, "key"), installment = text(form, "installment"), method = text(form, "method"), amount = positive(text(form, "amount"), 15000);
  if (!UUID.test(key) || !UUID.test(installment) || amount === null || !["EFECTIVO", "TRANSFERENCIA", "TARJETA", "YAPE", "PLIN"].includes(method)) return invalid("Revisa cuota, monto y medio de pago.");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("registrar_pago", { p_bazar: bazar, p_cuota: installment, p_monto: amount, p_clave: key, p_medio: method });
  if (error) return dbError(error.message);
  refresh("/pagos", "/creditos", "/cuentas-por-cobrar", "/caja");
  return { error: null, success: "Cobro registrado y aplicado a la cuota." };
}

export async function registerClient(_: OperationState, form: FormData): Promise<OperationState> {
  const bazar = await authorized(); if (!bazar) return businessError();
  const type = text(form, "document_type"), document = text(form, "document");
  const fields = customerFields(form); if (fields.error || !fields.data) return invalid(fields.error ?? "Revisa la ficha del cliente.");
  if (!["DNI", "RUC"].includes(type) || !(type === "DNI" ? /^\d{8}$/ : /^\d{11}$/).test(document)) return invalid("Revisa el tipo y número de documento.");
  if (form.get("consent") !== "yes") return invalid("Registra primero la autorización para guardar los datos del cliente.");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("clientes").insert({ id_bazar: bazar, ...fields.data, tipo_documento: type, numero_documento: document, consentimiento_fecha: new Date().toISOString() });
  if (error) return invalid(error.code === "23505" ? "Ya existe un cliente con ese documento en este bazar." : "No se pudo registrar el cliente. Revisa los datos.");
  refresh("/clientes", "/ventas");
  return { error: null, success: "Cliente registrado. Para venderle a crédito, configura primero su línea." };
}

export async function registerProduct(_: OperationState, form: FormData): Promise<OperationState> {
  const bazar = await authorized(); if (!bazar) return businessError();
  const fields = productFields(form); if (fields.error || !fields.data) return invalid(fields.error ?? "Revisa el producto.");
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("productos").insert({ id_bazar: bazar, codigo_sku: fields.sku, ...fields.data }).select("id_producto").single();
  if (error) return invalid(error.code === "23505" ? "El SKU ya existe en este bazar." : "No se pudo registrar el producto. Revisa los datos.");
  refresh("/inventario", "/compras", "/ventas");
  return { error: null, success: "Producto registrado con stock cero. Abre su ficha para agregar una fotografía; usa Compras para ingresar existencias.", productId: data?.id_producto };
}

export async function paySupplier(_: OperationState, form: FormData): Promise<OperationState> {
  const bazar = await authorized(); if (!bazar) return businessError();
  const key = text(form, "key"), purchase = text(form, "purchase"), amount = positive(text(form, "amount"), 1000000);
  if (!UUID.test(key) || !UUID.test(purchase) || amount === null) return invalid("Selecciona una compra y un monto válido.");
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("pagar_compra", { p_bazar: bazar, p_compra: purchase, p_monto: amount, p_clave: key });
  if (error) return dbError(error.message);
  refresh("/cuentas-por-pagar", "/compras", "/caja");
  return { error: null, success: "Pago al proveedor registrado en caja." };
}

export async function configureCredit(_: OperationState, form: FormData): Promise<OperationState> {
  const bazar = await authorized(); if (!bazar) return businessError();
  const customer = text(form, "customer");
  const line = positive(text(form, "line"), 10000), annual = percentageInput(text(form, "annual_rate"), 150), late = percentageInput(text(form, "late_rate"), 200);
  const cut = integer(text(form, "cut_day"), 1, 25), pay = integer(text(form, "pay_day"), 1, 30), months = integer(text(form, "months"), 2, 12);
  if (!UUID.test(customer) || line === null || line < 50 || annual === null || late === null || cut === null || pay === null || pay < cut + 5 || months === null) return invalid("Revisa la línea, las tasas y las fechas de corte/pago.");
  const supabase = await getSupabaseServerClient();
  const { data: person, error: lookupError } = await supabase.from("clientes").select("id_cliente").eq("id_bazar", bazar).eq("id_cliente", customer).eq("estado_registro", "ACTIVO").maybeSingle();
  if (lookupError || !person) return invalid("El cliente no pertenece al bazar activo.");
  const { error } = await supabase.from("configuraciones_credito").insert({
    id_cliente: customer, moneda: "PEN", linea_credito_max: line,
    tipo_tasa_compensatoria: "TEA", tasa_compensatoria: annual,
    tipo_tasa_moratoria: "TEA", tasa_moratoria: late,
    dia_corte: cut, dia_pago: pay, plazo_maximo_meses: months, activo: true,
  });
  if (error) return invalid(error.code === "23505" ? "Este cliente ya tiene una línea configurada." : "No se pudo configurar la línea. Revisa los datos.");
  refresh("/clientes", "/creditos", "/ventas");
  return { error: null, success: "Línea de crédito configurada. Las ventas futuras usarán estas condiciones." };
}
