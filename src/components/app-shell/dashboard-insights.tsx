"use client";

import { useId, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { FinancialOverview, SalesPoint } from "@/features/dashboard/presentation";
import { money } from "@/features/dashboard/model";
import { AnimatedNumber } from "./animated-number";
import { useWorkspaceMotion } from "./workspace-appearance";
import styles from "./dashboard-insights.module.css";
import { SalesActivity } from "./dashboard-sales-activity";

const tick = { fill: "var(--ws-muted)", fontSize: 11 };
const compact = (n: number) => n >= 1000 ? `${Number((n / 1000).toFixed(1))} mil` : String(n);
const tooltip = { background: "var(--ws-tooltip)", color: "var(--ws-text)", border: "1px solid var(--ws-border)", borderRadius: 14, fontSize: 12, boxShadow: "0 10px 25px #0002" };
const chartColors = ["var(--ws-accent)", "var(--ws-blue)"];

function Values({ rows, cumulative = false }: { rows: SalesPoint[]; cumulative?: boolean }) {
  return <details className={styles.data}><summary>Ver datos</summary><div><table><caption>{cumulative ? "Acumulado de la serie mensual" : "Ventas de la serie seleccionada"} · PEN</caption><thead><tr><th>Período</th><th>Importe</th></tr></thead><tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>{money(row.amount)}</td></tr>)}</tbody></table></div></details>;
}

export function DashboardInsights({ overview, synthetic }: { overview: FinancialOverview; synthetic: boolean }) {
  const reduced = useReducedMotion();
  const workspaceReduced = useWorkspaceMotion();
  const gradient = `cumulative-${useId().replaceAll(":", "")}`;
  const [curve, setCurve] = useState<"cumulative" | "daily">("cumulative");
  const month = overview.sales.month.filter(row => Number.isFinite(row.amount));
  // These sums compose plots from the existing PEN series; they are never sent
  // back as accounting totals, credit calculations or writes.
  const cumulative = month.reduce<SalesPoint[]>((previous, row) => [...previous, { label: row.label, amount: (previous.at(-1)?.amount ?? 0) + row.amount }], []);
  const curveRows = curve === "cumulative" ? cumulative : month;
  const totalMonth = cumulative.at(-1)?.amount;
  const dueMap = new Map<string, { date: string; label: string; receivable: number; payable: number }>();
  for (const item of overview.due) {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount)) continue;
    const record = dueMap.get(item.date) ?? { date: item.date, label: item.date.slice(8, 10) + "/" + item.date.slice(5, 7), receivable: 0, payable: 0 };
    record[item.kind] += amount; dueMap.set(item.date, record);
  }
  const commitments = [...dueMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  const animate = !reduced && !workspaceReduced;
  return <section className={styles.insights} aria-label="Análisis visual del negocio"><header className={styles.heading}><div><p>UNA MIRADA MÁS PROFUNDA</p><h2>Entiende el ritmo de tu negocio<span>.</span></h2><small>Ventas, actividad y compromisos · Soles (PEN){synthetic ? " · DEMO" : ""}</small></div><Link href="/reportes">Explorar reportes <ArrowUpRight size={16} /></Link></header>
    <div className={styles.grid}>
      <section className={`${styles.card} ${styles.wide}`}><header><div><h3><TrendingUp size={17} />Crecimiento de ventas del mes</h3><p>Acumulado del importe vendido, sin proyecciones</p></div><div className={styles.tabs} role="group" aria-label="Serie de evolución">{([["cumulative", "Acumulado"], ["daily", "Por día"]] as const).map(([key, title]) => <button key={key} aria-pressed={curve === key} onClick={() => setCurve(key)}>{title}</button>)}</div></header><div className={styles.total}>{totalMonth === undefined ? "—" : <AnimatedNumber value={totalMonth} currency="PEN" />}<span>en la serie mensual</span></div>
        {curveRows.length ? <><div className={styles.chart} key={curve}><ResponsiveContainer width="100%" height="100%" minWidth={0}><AreaChart data={curveRows} accessibilityLayer margin={{ left: 0, right: 18, bottom: 4, top: 10 }}><defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--ws-accent)" stopOpacity={.3} /><stop offset="1" stopColor="var(--ws-accent)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--ws-grid)" strokeDasharray="3 5" /><XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} minTickGap={30} /><YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={compact} width={55} /><Tooltip formatter={value => money(Number(value))} contentStyle={tooltip} itemStyle={{ color: "var(--ws-text)" }} /><Area type="monotone" dataKey="amount" name={curve === "cumulative" ? "Acumulado" : "Venta del día"} stroke="var(--ws-accent)" strokeWidth={2.5} fill={`url(#${gradient})`} isAnimationActive={animate} animationDuration={900} /></AreaChart></ResponsiveContainer></div><Values rows={curveRows} cumulative={curve === "cumulative"} /></> : <p className={styles.empty}>El registro de ventas alimentará esta evolución.</p>}
      </section>
      <SalesActivity overview={overview} />
      <section className={`${styles.card} ${styles.wide}`}><header><div><h3><CalendarDays size={17} />Próximos cobros y pagos</h3><p>Compara los compromisos próximos por fecha</p></div><Link href="/cuentas-por-cobrar" aria-label="Ver calendario de cuentas"><ArrowUpRight size={17} /></Link></header>{commitments.length ? <><div className={styles.chart}><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={commitments} accessibilityLayer margin={{ left: 0, right: 18, bottom: 4, top: 15 }}><CartesianGrid vertical={false} stroke="var(--ws-grid)" strokeDasharray="3 5" /><XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} /><YAxis tick={tick} tickLine={false} axisLine={false} width={55} tickFormatter={compact} /><Tooltip formatter={value => money(Number(value))} contentStyle={tooltip} itemStyle={{ color: "var(--ws-text)" }} cursor={{ fill: "var(--ws-fill)" }} /><Bar dataKey="receivable" name="Por cobrar" fill={chartColors[0]} radius={[8, 8, 0, 0]} maxBarSize={28} isAnimationActive={animate} animationDuration={900} /><Bar dataKey="payable" name="Por pagar" fill={chartColors[1]} radius={[8, 8, 0, 0]} maxBarSize={28} isAnimationActive={animate} animationDuration={900} /></BarChart></ResponsiveContainer></div><div className={styles.chartLegend}><span><i />Por cobrar</span><span><i />Por pagar</span></div><details className={styles.data}><summary>Ver compromisos por fecha</summary><div><table><thead><tr><th>Fecha</th><th>Por cobrar</th><th>Por pagar</th></tr></thead><tbody>{commitments.map(row => <tr key={row.date}><th scope="row">{row.label}</th><td>{money(row.receivable)}</td><td>{money(row.payable)}</td></tr>)}</tbody></table></div></details></> : <p className={styles.empty}>No hay compromisos próximos disponibles.</p>}<p className={styles.scope}>Usa los {overview.due.length} próximos registros de la agenda. No representa toda la deuda ni un flujo de caja proyectado.</p></section>
    </div>
  </section>;
}
