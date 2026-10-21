import { RevealHeading } from "@/components/app-shell/reveal-heading";
import Link from "next/link";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { Database, Info, FileSpreadsheet } from "lucide-react";
import { getPrivateContext } from "@/features/dashboard/context";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import { loadModule, type ModuleKind, type ModuleQuery } from "@/features/operations/module-data";
import { OperationsTable } from "./operations-table";
import { OperationComposer } from "./operation-panel";
import { navigationForRole } from "./navigation";
import { AnimatedMetric } from "./animated-number";
import { ReportsChart } from "./reports-chart";
import { OperationForm, type FormOptions } from "./operation-form";
import styles from "./operations.module.css";
import {ReceiptReader} from "@/components/public-apis/receipt-reader";
import {CurrencyConverter} from "@/components/public-apis/currency-converter";
import {QrExport} from "@/components/public-apis/report-export";

async function formOptions(kind: ModuleKind): Promise<FormOptions | null> {
  if (!["ventas", "compras", "pagos", "clientes", "inventario", "creditos", "cuentas-por-pagar"].includes(kind)) return null;
  const context = await getPrivateContext();
  if (!context.business || (context.business.role !== "PROPIETARIO" && context.user.role !== "SUPERADMIN")) return null;
  const supabase = await getSupabaseServerClient();
  const bazar = context.business.id;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (kind === "clientes" || kind === "inventario") return { key: randomUUID(), today, clients: [], products: [], installments: [], payables: [] };
  async function lookup(type:string){const r=await supabase.rpc('buscar_opciones',{p_bazar:bazar,p_tipo:type,p_busqueda:''});if(r.error)throw r.error;return (r.data??[]) as {id:string;label:string}[];}
  try{
   const [clients,products,installments,payables]=await Promise.all([
    ['ventas','creditos'].includes(kind)?lookup(kind==='creditos'?'sin_linea':'clientes'):Promise.resolve([]),
    ['ventas','compras'].includes(kind)?lookup(kind==='compras'?'productos_compra':'productos'):Promise.resolve([]),
    kind==='pagos'?lookup('cuotas'):Promise.resolve([]),kind==='cuentas-por-pagar'?lookup('proveedores'):Promise.resolve([]),
   ]);return {key:randomUUID(),today,clients,products,installments,payables};
  }catch{return null;}
}

export async function OperationsPage({ kind, query={} }: { kind: ModuleKind;query?:ModuleQuery }) {
  const context=await getPrivateContext();
  if(context.user.role==='CLIENTE')redirect('/portal');
  const [data, options] = await Promise.all([loadModule(kind,query), formOptions(kind)]);
  const toolsBusiness=context.business && ["DUENO_BAZAR","SUPERADMIN"].includes(context.user.role??"") && (context.business.role==="PROPIETARIO"||context.user.role==="SUPERADMIN") ? context.business.id : null;
  const formTitles: Partial<Record<ModuleKind, string>> = { ventas: "Nueva venta", compras: "Nueva compra", pagos: "Registrar cobro", clientes: "Nuevo cliente", inventario: "Nuevo producto", creditos: "Configurar crédito", "cuentas-por-pagar": "Registrar pago" };
  const operationForm = options && (kind === "ventas" || kind === "compras" || kind === "pagos" || kind === "clientes" || kind === "inventario" || kind === "cuentas-por-pagar" || kind === "creditos") ? <OperationComposer title={formTitles[kind]!}><OperationForm key={`${context.business!.id}:${kind}`} businessId={context.business!.id} kind={kind} options={options} isDemo={data.isDemo} /></OperationComposer> : null;
  const relatedPaths = ["compras", "inventario", "cuentas-por-pagar"].includes(kind) ? ["/inventario", "/compras", "/cuentas-por-pagar"] : ["caja", "reportes"].includes(kind) ? ["/caja", "/reportes", "/liquidaciones"] : ["/ventas", "/clientes", "/creditos", "/cuentas-por-cobrar", "/pagos"];
  const relatedNavigation = navigationForRole(context.user.role, Boolean(context.business)).filter(item => relatedPaths.includes(item.href));
  return <section className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>GESTIÓN DEL NEGOCIO</p><RevealHeading>{data.title}</RevealHeading><p>{data.description}</p></div><div className={styles.headingActions}><div className={styles.business}><Database size={15} aria-hidden="true" />{data.business ?? "Sin bazar"}</div>{!data.error && operationForm}</div></header>
    {relatedNavigation.length > 1 && <nav className={styles.moduleNav} aria-label="Secciones relacionadas">{relatedNavigation.map(item => <Link href={item.href} key={item.href} aria-current={item.href === `/${kind}` ? "page" : undefined}><item.icon size={15} aria-hidden="true" />{item.label}</Link>)}</nav>}
    {data.isDemo && <div className={styles.notice} role="status"><Info size={16} aria-hidden="true" /><p>Datos de demostración. Estos registros son ficticios y pertenecen solo al bazar seleccionado.</p><span>DEMO</span></div>}
    {data.error ? <div className={styles.error} role="alert"><p>{data.error}</p><Link href="/dashboard">Volver al Dashboard</Link></div> : <>
      <div className={styles.summary}>{data.summary.map(item => <section className={styles.summaryCard} key={item.label}><h2>{item.label}</h2><strong><AnimatedMetric text={item.value} /></strong></section>)}</div>
      {data.trend&&<ReportsChart data={data.trend} businessId={toolsBusiness??undefined} page={data.page} query={data.query}/>}
      {kind==="reportes"&&toolsBusiness&&<><CurrencyConverter key={toolsBusiness} businessId={toolsBusiness}/><QrExport key={toolsBusiness+"-qr"} businessId={toolsBusiness}/></>}
      {kind==="compras"&&toolsBusiness&&<ReceiptReader key={toolsBusiness} businessId={toolsBusiness}/>}
      {options && (kind === "inventario" || kind === "clientes") && <div className={styles.notice}><FileSpreadsheet size={18} aria-hidden="true" /><p>¿Ya tienes tus {kind === "inventario" ? "productos" : "clientes"} en una hoja de cálculo? <Link href={`/importar?tipo=${kind === "inventario" ? "productos" : "clientes"}`} className={styles.addItem}>Importar desde Excel o archivo</Link></p></div>}
      <p className={styles.limit}>Los indicadores abarcan todo el bazar. La búsqueda consulta sus registros; los filtros rápidos y las vistas se aplican a la página cargada.</p><OperationsTable key={`${kind}:${data.page}:${data.query}`} columns={data.columns} rows={data.rows} page={data.page} count={data.count} query={data.query} kind={kind} />
      {data.limited && <p className={styles.limit}>Se muestran los primeros 1000 registros de este bazar. La búsqueda se aplica a los registros cargados.</p>}
    </>}
  </section>;
}
