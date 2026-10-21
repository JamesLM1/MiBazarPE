"use client";
import { RevealHeading } from "@/components/app-shell/reveal-heading";

import Link from "next/link";
import { SelectionPill } from "./workspace-selection";
import { useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, ChartNoAxesCombined, CircleHelp, HandCoins, Info, Maximize2, Minimize2, Package, Plus, ShoppingBag, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardData, PrivateContext } from "@/features/dashboard/types";
import { money } from "@/features/dashboard/model";
import { dashboardDemo, demoLowStock } from "@/features/dashboard/demo";
import { salesPeriods, type FinancialOverview, type SalesPeriod } from "@/features/dashboard/presentation";
import { CategoryChart, ReceivablesChart, SalesChart, type SalesView } from "./dashboard-charts";
import { BalanceSnapshot, DashboardAgenda, FocusTimer, InventoryWidget, RecentActivity } from "./dashboard-widgets";
import styles from "./dashboard.module.css";
import { AnimatedMetric } from "./animated-number";
import { DashboardInsights } from "./dashboard-insights";

function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <div className={styles.empty}><ChartNoAxesCombined size={25} strokeWidth={1.3} aria-hidden="true" /><h3>{title}</h3><p>{children}</p></div>;
}
const periodDescriptions: Record<SalesPeriod, string> = { day: "Por hora", week: "Por día de la semana", month: "Evolución del mes", year: "Por mes del año" };

export function Dashboard({ context, data, financial }: { context: PrivateContext; data: DashboardData; financial: FinancialOverview }) {
  const [dashboardTab, setDashboardTab] = useState("overview");
  const dashboardTabs = [{key:"overview",label:"Resumen"},{key:"analysis",label:"Análisis"},{key:"agenda",label:"Agenda"}];
  const [demo, setDemo] = useState(false);
  const [period, setPeriod] = useState<SalesPeriod>("month");
  const [chartView, setChartView] = useState<SalesView>("bars");
  const [expanded, setExpanded] = useState(false);
  const overview = demo ? dashboardDemo : financial;
  const isDemo = overview.source === "demo";
  const isSynthetic = isDemo || overview.source === "database-demo";
  const selectedSales = overview.sales[period];
  const hasSelectedSales = selectedSales.some(point => point.amount > 0);
  const availablePeriod = (["month", "year"] as const).find(candidate => candidate !== period && overview.sales[candidate].some(point => point.amount > 0));
  const lowStock = isDemo ? demoLowStock : data.inventory ? data.inventory.low + data.inventory.empty : null;
  const metrics = [
    { title: "Ventas de hoy", value: overview.todaySales === null ? "—" : money(Number(overview.todaySales)), note: "Total vendido durante el día", icon: ShoppingBag, href: "/ventas" },
    { title: "Ingresos de hoy", value: overview.todayIncome === null ? "—" : money(Number(overview.todayIncome)), note: "Dinero recibido durante el día", icon: Wallet, href: "/caja" },
    { title: "Por cobrar", value: overview.receivables === null ? "—" : money(Number(overview.receivables)), note: "Saldo pendiente de tus clientes", icon: HandCoins, href: "/cuentas-por-cobrar" },
    { title: "Stock bajo", value: lowStock === null ? "—" : String(lowStock), note: data.inventoryError && !isDemo ? "No se pudo consultar el inventario" : "Productos que necesitan reposición", icon: Package, href: "/inventario" },
  ];
  if (context.user.role === "DUENO_BAZAR" && !context.business && context.notice?.startsWith("Tu cuenta aún no tiene un bazar") && !demo) {
    return <section className={styles.dashboard}><div className={styles.pageHeading}><div><p className={styles.eyebrow}>TU ESPACIO DE TRABAJO</p><RevealHeading>Hola, {context.user.name.split(/\s+/)[0]}</RevealHeading><p className={styles.subtitle}>Tu cuenta ya está activa como dueño de bazar.</p></div></div><div className={styles.onboardingCard}><p className={styles.eyebrow}>PRIMER PASO</p><h2>Crea tu negocio para empezar</h2><p>El perfil identifica a la persona. El negocio guarda sus propios productos, clientes y operaciones. Puedes registrar los datos uno a uno o traer tu catálogo desde Excel.</p><div className={styles.onboardingActions}><Link href="/mi-negocio/nuevo" className={styles.onboardingPrimary}>Crear mi negocio <ArrowRight size={16} aria-hidden="true" /></Link><Link href="/importar">Explorar importación de Excel <ArrowRight size={16} aria-hidden="true" /></Link><button type="button" onClick={() => setDemo(true)}>Ver Dashboard de ejemplo</button></div><ol className={styles.onboardingSteps}><li><strong>1. Registra el negocio</strong><span>Usa los datos de un establecimiento que estés autorizado a registrar.</span></li><li><strong>2. Añade productos y clientes</strong><span>Sus fichas formarán el inventario y las líneas de crédito.</span></li><li><strong>3. Registra operaciones</strong><span>Las ventas, compras y pagos alimentarán los indicadores y gráficas.</span></li></ol></div></section>;
  }
  return <div className={styles.dashboard}>
    <div className={styles.pageHeading}><div><p className={styles.eyebrow}>RESUMEN DEL NEGOCIO</p><RevealHeading>Hola, {context.user.name.split(/\s+/)[0]}<span className={styles.headingDot}>.</span></RevealHeading><p className={styles.subtitle}>Todo lo importante de tu negocio, en una sola vista.</p></div><div className={styles.headingActions}><Button variant="outline" onClick={() => setDemo(!demo)} aria-pressed={demo} className={styles.demoButton}>{demo ? "Salir de demostración" : "Ver demostración"}</Button>{context.business && <Button asChild className={styles.primary}><Link href="/ventas?nuevo=1"><Plus size={16} aria-hidden="true" />Nueva venta</Link></Button>}</div></div>
    {isSynthetic ? <div className={styles.contextNotice} role="status"><Info size={16} aria-hidden="true" /><p><strong>Modo demostración.</strong> Los importes, clientes, productos y fechas de este resumen son ficticios y no representan tu negocio.</p><span className={styles.demoBadge}>DEMO</span></div> : context.notice && <div className={styles.contextNotice} role="status"><Info size={16} aria-hidden="true" /><p>{context.notice}</p><Link href="/configuracion" aria-label="Ver configuración del negocio"><ArrowUpRight size={16} /></Link></div>}
    {overview.source === "live" && context.user.role === "DUENO_BAZAR" && data.inventory?.total === 0 && <div className={styles.contextNotice} role="region" aria-label="Empieza a registrar tu negocio"><Info size={18} aria-hidden="true" /><div><strong>Tu negocio ya está conectado. Empieza con tus productos.</strong><p>Regístralos uno a uno o importa tu catálogo. Las ventas y los cobros actualizarán tu Dashboard automáticamente.</p><div className={styles.onboardingActions}><Button asChild><Link href="/inventario">Registrar productos <ArrowRight size={16} aria-hidden="true" /></Link></Button><Button asChild variant="outline"><Link href="/importar">Importar Excel o CSV <ArrowRight size={16} aria-hidden="true" /></Link></Button></div></div></div>}
    <div className={styles.metrics}>{metrics.map(metric => <Link href={metric.href} className={[styles.card, styles.kpi].join(" ")} key={metric.title} aria-label={`${metric.title}: ${metric.value === "—" ? "no disponible" : metric.value}. Abrir módulo`}><div className={styles.kpiTop}><h2>{metric.title}</h2><span><metric.icon size={18} strokeWidth={1.5} aria-hidden="true" /></span></div><strong className={styles.kpiValue}><AnimatedMetric text={metric.value} /></strong><p className={styles.kpiNote}>{metric.value === "—" ? <><CircleHelp size={12} aria-hidden="true" />Pendiente de datos</> : isSynthetic ? "Datos de demostración" : "Datos del negocio"}<ArrowUpRight size={13} aria-hidden="true" /></p><p className={styles.kpiDescription}>{metric.note}</p></Link>)}</div>
    <div className={styles.dashboardTabs} role="tablist" aria-label="Vistas del dashboard">{dashboardTabs.map((item,index)=><button type="button" role="tab" id={`dashboard-tab-${item.key}`} aria-controls="dashboard-view-panel" aria-selected={dashboardTab===item.key} tabIndex={dashboardTab===item.key?0:-1} key={item.key} onClick={()=>setDashboardTab(item.key)} onKeyDown={event=>{ if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return; event.preventDefault(); const next = event.key==="Home"?0:event.key==="End"?2:(index+(event.key==="ArrowRight"?1:2))%3; setDashboardTab(dashboardTabs[next].key); event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus(); }}>{dashboardTab===item.key && <SelectionPill group="dashboard" />}{item.label}</button>)}</div>
    <div id="dashboard-view-panel" role="tabpanel" aria-labelledby={`dashboard-tab-${dashboardTab}`} className={styles.dashboardPanel} key={dashboardTab}>
    {dashboardTab==="overview"&&<>
    <div className={styles.overviewGrid} data-expanded={expanded}>
      <section className={[styles.card, styles.salesCard].join(" ")}><header className={styles.cardHeader}><div><p className={styles.sectionLabel}>RENDIMIENTO COMERCIAL</p><h2>Así se mueven tus ventas</h2><p>{periodDescriptions[period]} · Soles (PEN){isSynthetic ? " · DEMO" : ""}</p></div><div className={styles.periods} role="group" aria-label="Período de ventas">{salesPeriods.map(item => <button type="button" key={item.value} aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div></header>{selectedSales.length && (hasSelectedSales || chartView === "table") ? <SalesChart key={`${period}-${overview.source}`} data={selectedSales} view={chartView} /> : selectedSales.length ? <Empty title={period === "day" ? "Hoy aún no hay ventas registradas" : "Sin ventas en este período"}>Los datos de esta selección están en cero.{availablePeriod && <button type="button" className={styles.emptyAction} onClick={() => setPeriod(availablePeriod)}>{availablePeriod === "month" ? "Ver ventas de este mes" : "Ver ventas del año"}<ArrowRight size={14} aria-hidden="true" /></button>}</Empty> : <Empty title="Tus ventas, con perspectiva">La gráfica aparecerá cuando el registro de ventas esté disponible. Puedes explorar su presentación en modo demostración.</Empty>}<div className={styles.chartToolbar}><div className={styles.chartViews} role="group" aria-label="Presentación de ventas">{([["area", "Área"], ["bars", "Barras"], ["line", "Líneas"], ["table", "Datos"]] as const).map(([value, label]) => <button type="button" aria-pressed={chartView === value} key={value} onClick={() => setChartView(value)}>{label}</button>)}</div><button type="button" className={styles.expandButton} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}{expanded ? "Reducir" : "Ampliar"}</button></div><div className={styles.cardFoot}><span><i className={styles.legendDot} />Ventas del período</span><span>El selector cambia solo esta gráfica</span></div></section>
      <DashboardAgenda key={overview.source} items={overview.due} synthetic={isSynthetic} />
    </div>
    <div className={styles.bottomGrid}>
      <section className={styles.card}><header className={styles.cardHeader}><div><p className={styles.sectionLabel}>COMPOSICIÓN DE VENTAS</p><h2>Qué categorías destacan</h2><p>Distribución registrada{isSynthetic ? " · DEMO" : ""}</p></div><ShoppingBag size={18} aria-hidden="true" /></header>{overview.categories.length ? <CategoryChart data={overview.categories} /> : <Empty title="Conoce qué se vende más">{overview.source === "live" ? "Registra ventas con tus productos y verás aquí su distribución." : "No se pudo obtener la distribución de ventas. Revisa el acceso al negocio e inténtalo de nuevo."}</Empty>}<Link href="/reportes" className={styles.cardLink}>Explorar reportes <ArrowRight size={14} aria-hidden="true" /></Link></section>
      <section className={styles.card}><header className={styles.cardHeader}><div><p className={styles.sectionLabel}>VISIÓN DE TU CARTERA</p><h2>Estado de cuentas por cobrar</h2><p>Distribución de los estados registrados{isSynthetic ? " · DEMO" : ""}</p></div><HandCoins size={18} aria-hidden="true" /></header>{overview.accountStates.length ? <ReceivablesChart data={overview.accountStates} /> : <Empty title="Tus cuentas, en orden">{overview.source === "live" ? "No hay saldos pendientes por cobrar. Tus créditos y pagos actualizarán esta sección." : "No se pudo obtener el estado de las cuentas. Revisa el acceso al negocio e inténtalo de nuevo."}</Empty>}<Link href="/cuentas-por-cobrar" className={styles.cardLink}>Ver cuentas por cobrar <ArrowRight size={14} aria-hidden="true" /></Link></section>
    </div>
    </>}
    {dashboardTab!=="agenda"&&<DashboardInsights overview={overview} synthetic={isSynthetic} />}
    {dashboardTab==="agenda"&&<DashboardAgenda key={overview.source} items={overview.due} synthetic={isSynthetic} />}
    {dashboardTab==="overview"&&<>
    <div className={styles.workspaceExtras}><InventoryWidget data={data} demo={isDemo} lowStock={lowStock} /><RecentActivity data={data} demo={isDemo} /><div className={styles.workspaceUtilities}><FocusTimer /><BalanceSnapshot overview={overview} /></div></div>
    <div className={styles.quickLinks}><Link href="/cuentas-por-pagar" className={styles.quickLink}><span>Cuentas por pagar</span><strong>{overview.payables === undefined ? "—" : money(Number(overview.payables))}</strong><ArrowRight size={15} aria-hidden="true" /></Link><Link href="/clientes" className={styles.quickLink}><span>Clientes con crédito</span><strong>{overview.creditClients ?? "—"}</strong><ArrowRight size={15} aria-hidden="true" /></Link></div>
    </>}
    <p className={styles.dataNote}>{isSynthetic ? "Datos sintéticos. Ventas e ingresos corresponden a hoy; cartera e inventario muestran su estado actual. El selector de período modifica la gráfica principal." : "Los indicadores sin información se muestran con —. Stock bajo incluye productos agotados y requiere acceso al inventario del bazar."}{overview.otherCurrencies && " Los importes de este resumen incluyen solo PEN."}</p>
    </div>
  </div>;
}
