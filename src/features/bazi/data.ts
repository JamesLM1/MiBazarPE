import "server-only";
import { getPrivateContext } from "@/features/dashboard/context";
import { loadDashboard } from "@/features/dashboard/service";
import { loadFinancialOverview } from "@/features/dashboard/financial";
import { displayRole, money } from "@/features/dashboard/model";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import { baziScope, canManageBazi } from "./model";
import { geminiConfiguration } from "./gemini";
import { loadWorkspace } from "./persistence";
import type { BaziBootstrap, BaziIntent, BaziReply } from "./types";

export async function getBaziContext() {
  const context = await getPrivateContext();
  if (!["CLIENTE", "DUENO_BAZAR", "SUPERADMIN"].includes(context.user.role ?? "")) throw new Error("Tu perfil todavía no tiene acceso a Bazi.");
  const db = await getSupabaseServerClient();
  const isClient = context.user.role === "CLIENTE";
  let businessId = context.business?.id ?? null;
  let businessName = context.business?.name ?? "Sin negocio seleccionado";
  let clientId: string | null = null;
  let isDemo = false;
  if (isClient) {
    const customer = await db.from("clientes").select("id_cliente,id_bazar,bazares(nombre_comercial,id_lote_demo)")
      .eq("id_usuario", context.user.id).eq("estado_registro", "ACTIVO").order("created_at").limit(1).maybeSingle();
    if (customer.error) throw new Error("No pudimos comprobar el acceso a tu cuenta cliente.");
    businessId = customer.data?.id_bazar ?? null;
    clientId = customer.data?.id_cliente ?? null;
    const business = Array.isArray(customer.data?.bazares) ? customer.data?.bazares[0] : customer.data?.bazares;
    businessName = business?.nombre_comercial ?? "Cuenta sin vincular";
    isDemo = Boolean(business?.id_lote_demo);
  }
  return { context, db, businessId, businessName, clientId, isClient, isDemo,
    scope: baziScope(context.user.id, context.user.role, `${businessId ?? "none"}:${clientId ?? "business"}`),
    canManage: !isClient && canManageBazi(context.user.role, context.business?.role ?? null) };
}
export type BaziContext = Awaited<ReturnType<typeof getBaziContext>>;
const stamp = () => new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" }).format(new Date());
const reply = (text: string): BaziReply => ({ text, cards: [], proposals: [], source: "direct" });
export async function directReply(auth: BaziContext, requested: BaziIntent): Promise<BaziReply> {
  const intent = auth.isClient && requested !== "help" ? "account" : requested;
  if (intent === "help") return { ...reply("Puedo consultar tus registros y mostrar resultados. Con Gemini conectado también puedo interpretar tus peticiones y preparar propuestas que tú revisas. Puedes programar resúmenes en Rutinas y revisar los resultados guardados."), cards: [{ id: "help", title: "Antes de confirmar", caption: "Reglas de MiBazarPE", kind: "note", rows: [["Una venta a crédito no equivale a un ingreso de caja."], ["Los cambios de precio se aplican a ventas futuras."], ["Los pagos se registran después de recibirlos; Bazi no procesa transferencias."], ["El crédito respeta existencias, línea disponible y vencimientos."]], links: [{ label: "Abrir mi cuenta", href: auth.isClient ? "/portal" : "/dashboard" }] }] };
  if (!auth.businessId) return reply(auth.isClient ? "Todavía no tienes una cuenta vinculada. Acepta la invitación de tu bazar para consultar tus cuotas." : "Selecciona o crea un negocio para consultar sus registros con Bazi.");
  if (intent === "account") {
    if (!auth.isClient || !auth.clientId) return reply("Abre Mi cuenta cliente para consultar tus compras personales.");
    const [account, dues] = await Promise.all([
      auth.db.from("cuentas_corrientes").select("deuda_total,saldo_disponible,linea_credito_max,moneda,en_mora").eq("id_bazar", auth.businessId).eq("id_cliente", auth.clientId).maybeSingle(),
      auth.db.from("cuentas_por_cobrar").select("vencimiento,numero,saldo,moneda").eq("id_bazar", auth.businessId).eq("id_cliente", auth.clientId).gt("saldo", 0).order("vencimiento").limit(8),
    ]);
    if (account.error || dues.error) throw new Error("No pudimos consultar todos tus saldos. Abre tu cuenta para intentarlo de nuevo.");
    const currency = account.data?.moneda === "USD" ? "USD" : "PEN";
    const format = (v: unknown) => new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(Number(v));
    const result = reply(account.data ? "Este es el estado de la cuenta vinculada que estás consultando. Los pagos los registra el bazar después de recibirlos." : "Tu cuenta está vinculada, pero todavía no tiene una línea de crédito registrada.");
    if (account.data) result.cards.push({ id: "account", title: "Mi cuenta", caption: `${auth.businessName} · ${currency} · ${stamp()}`, kind: "metrics", metrics: [{ label: "Saldo pendiente", value: format(account.data.deuda_total) }, { label: "Línea disponible", value: format(account.data.saldo_disponible) }], links: [{ label: "Ver mi cuenta completa", href: `/portal?client=${auth.clientId}` }] });
    if (dues.data?.length) result.cards.push({ id: "installments", title: "Mis cuotas pendientes", caption: "Hasta 8 cuotas, ordenadas por vencimiento", kind: "table", columns: ["Vence", "Cuota", "Saldo"], rows: dues.data.map(r => [r.vencimiento, String(r.numero), new Intl.NumberFormat("es-PE", { style: "currency", currency: r.moneda }).format(Number(r.saldo))]) });
    return result;
  }
  if (intent === "inventory") {
    const data = await loadDashboard();
    if (!data.inventory || data.inventoryError) throw new Error("El inventario no está disponible. No interpretaré ese fallo como stock cero.");
    const result = reply(data.inventory.alerts.length ? "Estos productos necesitan una revisión de reposición. La lista usa el stock mínimo configurado; no es un pronóstico de demanda." : "Los productos consultados tienen existencias por encima de su mínimo.");
    result.cards.push({ id: "inventory", title: "Salud del inventario", caption: `Registros del negocio · ${stamp()}`, kind: "metrics", metrics: [{ label: "Productos", value: String(data.inventory.total) }, { label: "Stock bajo", value: String(data.inventory.low) }, { label: "Agotados", value: String(data.inventory.empty) }], links: [{ label: "Abrir inventario", href: "/inventario" }] });
    if (data.inventory.alerts.length) result.cards.push({ id: "stock", title: "Lista de reposición", caption: `Hasta 12 de ${data.inventory.alerts.length} alertas · prioriza agotados`, kind: "table", columns: ["Producto", "Stock", "Mínimo"], rows: data.inventory.alerts.slice(0, 12).map(p => [p.nombre, String(p.stock_actual), String(p.stock_minimo)]) });
    return result;
  }
  const data = await loadFinancialOverview(auth.context);
  if (data.source === "unavailable") throw new Error("El resumen financiero no está disponible. Consulta nuevamente desde el Dashboard.");
  const caption = `${data.source === "database-demo" || data.source === "demo" ? "DEMO · " : ""}Soles (PEN) · ${stamp()}`;
  if (intent === "sales") return { ...reply("Esta serie muestra las ventas por mes en el período disponible. Un período sin ventas se mantiene en cero; no representa un error de carga."), cards: [{ id: "sales", title: "Evolución de ventas", caption, kind: "chart", points: data.sales.year, links: [{ label: "Explorar períodos y detalle", href: "/dashboard" }, { label: "Abrir ventas", href: "/ventas" }] }] };
  if (intent === "due") return { ...reply(data.due.length ? "Estos son los próximos registros de la agenda, no toda la deuda del negocio. Revisa cada cuenta antes de registrar un cobro o un pago." : "La agenda consultada no devuelve compromisos próximos. Puedes revisar el listado completo de cuentas."), cards: [{ id: "due", title: "Próximos cobros y pagos", caption: `${caption} · hasta 8 registros de la agenda`, kind: "table", columns: ["Fecha", "Nombre", "Tipo", "Importe"], rows: data.due.slice(0, 8).map(r => [r.date, r.name, r.kind === "payable" ? "Por pagar" : "Por cobrar", money(Number(r.amount))]), links: [{ label: "Cuentas por cobrar", href: "/cuentas-por-cobrar" }, { label: "Cuentas por pagar", href: "/cuentas-por-pagar" }] }] };
  return { ...reply("Este es tu punto de partida: ventas e ingresos de hoy, junto con los saldos actuales del negocio. Elige una consulta para profundizar."), cards: [{ id: "summary", title: "Tu negocio, en una vista", caption, kind: "metrics", metrics: [{ label: "Ventas de hoy", value: data.todaySales === null ? "—" : money(Number(data.todaySales)) }, { label: "Ingresos de hoy", value: data.todayIncome === null ? "—" : money(Number(data.todayIncome)) }, { label: "Por cobrar", value: data.receivables === null ? "—" : money(Number(data.receivables)) }, { label: "Por pagar", value: data.payables === undefined ? "—" : money(Number(data.payables)) }], links: [{ label: "Abrir Dashboard", href: "/dashboard" }] }] };
}
export async function loadBazi(): Promise<BaziBootstrap> {
  const auth = await getBaziContext();
  const config = geminiConfiguration();
  const saved = await loadWorkspace(auth);
  let greeting: BaziReply;
  try { greeting = await directReply(auth, auth.isClient ? "account" : "summary"); }
  catch (error) { greeting = reply(error instanceof Error ? error.message : "No pudimos cargar el resumen."); }
  const isDemo = auth.isDemo || greeting.cards.some(c => c.caption.startsWith("DEMO"));
  return { scope: auth.scope, name: auth.context.user.name.split(" ")[0], business: auth.businessName,
    role: displayRole(auth.context.user.role), isClient: auth.isClient, canManage: auth.canManage,
    configured: Boolean(config.key && config.model), model: config.model ?? null, isDemo,
    accessible: Boolean(auth.businessId), greeting, generatedAt: stamp(), saved: saved.state, savedVersion: saved.version, persistenceError: saved.error };
}
