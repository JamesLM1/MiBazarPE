"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { useWorkspaceMotion } from "./workspace-appearance";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Maximize2, Minimize2 } from "lucide-react";
import { ReportExport } from "@/components/public-apis/report-export";
import styles from "./operations.module.css";
import panels from "./operations-panels.module.css";

type Point = { month: string; cash: number; credit: number; currency: string };
const tick = { fill: "var(--ws-muted)", fontSize: 11 };
const compact = (n: number) => n >= 1000 ? `${Number((n / 1000).toFixed(1))} mil` : String(n);
const tooltip = { background: "var(--ws-tooltip)", border: "1px solid var(--ws-border)", borderRadius: 12, color: "var(--ws-text)", fontSize: 12, boxShadow: "0 15px 40px #0006" };

export function ReportsChart({ data, businessId, page = 1, query = "" }: { data: Point[]; businessId?: string; page?: number; query?: string }) {
  const reduced = useReducedMotion(); const workspaceReduced = useWorkspaceMotion();
  const currencies = [...new Set(data.map(point => point.currency))];
  const [selected, setCurrency] = useState(currencies[0] ?? "PEN");
  const [range, setRange] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showData, setShowData] = useState(false);
  const currency = currencies.includes(selected) ? selected : currencies[0];
  const allRows = data.filter(point => point.currency === currency);
  const rows = (range ? allRows.slice(-range) : allRows).map(point => ({ ...point, total: point.cash + point.credit }));
  const split = [{ name: "Contado", value: rows.reduce((sum, point) => sum + point.cash, 0), fill: "var(--ws-chart-secondary)" }, { name: "Crédito", value: rows.reduce((sum, point) => sum + point.credit, 0), fill: "var(--ws-accent)" }];
  const format = (n: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: currency ?? "PEN", maximumFractionDigits: 2 }).format(n);
  if (!rows.length) return null;
  return <>
    <div className={panels.reportControls}><div><h2>Visión del rendimiento comercial</h2><p>{rows[0].month} a {rows.at(-1)?.month} · meses de esta página · {currency}</p></div><div className={panels.reportPickers}>{currencies.length > 1 && <label>Moneda<select value={currency} onChange={event => setCurrency(event.target.value)}>{currencies.map(item => <option key={item}>{item}</option>)}</select></label>}<div className={panels.calendarModes} role="group" aria-label="Meses de las gráficas">{[[3, "3 meses"], [6, "6 meses"], [12, "12 meses"], [0, "Todos"]].map(([value, label]) => <button type="button" key={value} aria-pressed={range === value} onClick={() => setRange(Number(value))}>{label}</button>)}</div></div></div>
    <div className={panels.analyticsGrid} data-expanded={expanded}>
      <section className={styles.tableCard}><div className={styles.tableBar}><div><h2>Contado y crédito</h2><p>Composición de ventas por mes · {currency}</p></div><div className={panels.reportInlineActions}><button type="button" className={panels.secondaryButton} onClick={() => setShowData(!showData)}>{showData ? "Ver gráfica" : "Ver datos"}</button><button type="button" className={panels.secondaryButton} aria-expanded={expanded} onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Reducir gráfica de composición" : "Ampliar gráfica de composición"}>{expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button></div></div>
        {showData ? <div className={styles.tableScroll}><table><caption>Ventas de los meses seleccionados · {currency}</caption><thead><tr><th>Mes</th><th>Contado</th><th>Crédito</th></tr></thead><tbody>{rows.map(row => <tr key={row.month}><td>{row.month}</td><td>{format(row.cash)}</td><td>{format(row.credit)}</td></tr>)}</tbody></table></div> : <div className={styles.reportChart}><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={rows} accessibilityLayer margin={{ top: 16, right: 20, left: 2, bottom: 8 }}><CartesianGrid vertical={false} stroke="var(--ws-grid)" /><XAxis dataKey="month" tick={tick} minTickGap={24} tickLine={false} axisLine={false} /><YAxis tickFormatter={compact} tick={tick} tickLine={false} axisLine={false} width={58} /><Tooltip formatter={value => format(Number(value))} contentStyle={tooltip} itemStyle={{ color: "var(--ws-text)" }} cursor={{ fill: "var(--ws-fill)" }} /><Bar name="Contado" dataKey="cash" stackId="sales" fill="var(--ws-chart-secondary)" maxBarSize={40} isAnimationActive={!reduced && !workspaceReduced} animationDuration={900} /><Bar name="Crédito" dataKey="credit" stackId="sales" fill="var(--ws-accent)" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={!reduced && !workspaceReduced} animationDuration={900} /></BarChart></ResponsiveContainer></div>}
        <div className={panels.reportLegend}><span><i style={{ background: "var(--ws-tooltip)" }} />Contado</span><span><i style={{ background: "var(--ws-tooltip)" }} />Crédito</span></div></section>
      <section className={styles.tableCard}><div className={styles.tableBar}><div><h2>Distribución por modalidad</h2><p>Composición de los meses seleccionados</p></div></div><div className={panels.reportDonut}><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart accessibilityLayer><Pie data={split} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="90%" paddingAngle={3} stroke="none" isAnimationActive={!reduced && !workspaceReduced} animationDuration={900}>{split.map(item => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip formatter={value => format(Number(value))} contentStyle={tooltip} itemStyle={{ color: "var(--ws-text)" }} /></PieChart></ResponsiveContainer><span>{currency}<small>Modalidades</small></span></div><div className={panels.reportBreakdown}>{split.map(item => <div key={item.name}><span><i style={{ background: item.fill }} />{item.name}</span><strong>{format(item.value)}</strong></div>)}</div></section>
      <section className={`${styles.tableCard} ${panels.reportTrend}`}><div className={styles.tableBar}><div><h2>Evolución del importe vendido</h2><p>Contado y crédito reunidos por mes · {currency}</p></div></div><div className={styles.reportChart}><ResponsiveContainer width="100%" height="100%" minWidth={0}><AreaChart data={rows} accessibilityLayer margin={{ top: 16, right: 20, left: 2, bottom: 8 }}><CartesianGrid vertical={false} stroke="var(--ws-grid)" /><XAxis dataKey="month" tick={tick} minTickGap={25} tickLine={false} axisLine={false} /><YAxis tickFormatter={compact} tick={tick} tickLine={false} axisLine={false} width={58} /><Tooltip formatter={value => format(Number(value))} contentStyle={tooltip} itemStyle={{ color: "var(--ws-text)" }} /><Area type="monotone" name="Ventas" dataKey="total" stroke="var(--ws-accent)" strokeWidth={2.5} fill="var(--ws-accent)" fillOpacity={0.1} isAnimationActive={!reduced && !workspaceReduced} animationDuration={900} /></AreaChart></ResponsiveContainer></div></section>
    </div><p className={styles.limit}>Las gráficas usan únicamente los meses cargados y la moneda seleccionada. El rango afecta las gráficas; la exportación conserva el alcance de esta página.</p>{businessId && currency && <ReportExport key={`${businessId}:${currency}:${page}:${query}`} businessId={businessId} currency={currency} page={page} query={query} />}
  </>;
}
