"use client";

import { useId } from "react";
import { useReducedMotion } from "motion/react";
import { useWorkspaceMotion } from "./workspace-appearance";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Breakdown, SalesPoint } from "@/features/dashboard/presentation";
import { money } from "@/features/dashboard/model";
import styles from "./dashboard.module.css";

const tooltipStyle = { background: "var(--ws-tooltip)", border: "1px solid var(--ws-border)", borderRadius: 12, color: "var(--ws-text)", fontSize: 12, boxShadow: "0 12px 30px #0006" };
const tick = { fill: "var(--ws-muted)", fontSize: 11 };
const axisMoney = (value: number) => value >= 1000 ? `${Number((value / 1000).toFixed(1))} mil` : String(value);
export type SalesView = "area" | "bars" | "line" | "table";

export function SalesChart({ data, view = "area" }: { data: SalesPoint[]; view?: SalesView }) {
  const reduced = useReducedMotion();
  const workspaceReduced = useWorkspaceMotion();
  const gradientId = `sales-${useId().replaceAll(":", "")}`;
  const dataTable = <table><caption>Ventas del período en soles</caption><thead><tr><th scope="col">Período</th><th scope="col">Importe</th></tr></thead><tbody>{data.map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>{money(row.amount)}</td></tr>)}</tbody></table>;
  if (view === "table") return <div className={styles.chartTable}>{dataTable}</div>;
  const shared = <><CartesianGrid vertical={false} stroke="var(--ws-grid)" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} minTickGap={28} /><YAxis tickLine={false} axisLine={false} tick={tick} width={57} tickFormatter={axisMoney} /><Tooltip formatter={value => money(Number(value))} contentStyle={tooltipStyle} itemStyle={{ color: "var(--ws-text)" }} cursor={view === "bars" ? { fill: "var(--ws-fill)" } : { stroke: "#747a84", strokeDasharray: "3 4" }} /></>;
  return <div key={view} className={styles.chart} aria-label="Ventas del período en soles"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 300 }}>{view === "bars" ? <BarChart data={data} accessibilityLayer margin={{ left: 0, right: 18, top: 20, bottom: 5 }}>{shared}<Bar dataKey="amount" name="Ventas" fill="var(--ws-accent)" radius={[7, 7, 0, 0]} maxBarSize={36} isAnimationActive={!reduced && !workspaceReduced} animationDuration={900} /></BarChart> : view === "line" ? <LineChart data={data} accessibilityLayer margin={{ left: 0, right: 18, top: 20, bottom: 5 }}>{shared}<Line type="monotone" dataKey="amount" name="Ventas" stroke="var(--ws-accent)" strokeWidth={2.5} dot={false} isAnimationActive={!reduced && !workspaceReduced} animationDuration={900} /></LineChart> : <AreaChart data={data} accessibilityLayer margin={{ left: 0, right: 18, top: 20, bottom: 5 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ws-accent)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--ws-accent)" stopOpacity={0.01} /></linearGradient></defs>{shared}<Area type="monotone" dataKey="amount" name="Ventas" stroke="var(--ws-accent)" strokeWidth={2.5} fill={`url(#${gradientId})`} activeDot={{ r: 5, fill: "var(--ws-muted)", stroke: "#e2edff", strokeWidth: 2 }} isAnimationActive={!reduced && !workspaceReduced} animationDuration={900} /></AreaChart>}</ResponsiveContainer><details className={styles.accessibleData}><summary>Ver datos de ventas</summary>{dataTable}</details></div>;
}

export function CategoryChart({ data }: { data: Breakdown[] }) {
  const reduced = useReducedMotion(); const workspaceReduced = useWorkspaceMotion();
  return <div className={styles.categoryChart} aria-label="Ventas por categoría en soles"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 430, height: 250 }}><BarChart data={data} layout="vertical" accessibilityLayer margin={{ top: 13, right: 28, bottom: 8, left: 0 }}><CartesianGrid horizontal={false} stroke="var(--ws-grid)" /><XAxis type="number" tick={tick} tickLine={false} axisLine={false} tickFormatter={axisMoney} /><YAxis type="category" dataKey="name" width={112} tick={tick} tickLine={false} axisLine={false} /><Tooltip formatter={value => money(Number(value))} contentStyle={tooltipStyle} itemStyle={{ color: "var(--ws-text)" }} cursor={{ fill: "var(--ws-fill)" }} /><Bar dataKey="amount" name="Ventas" radius={[0, 5, 5, 0]} barSize={18} isAnimationActive={!reduced && !workspaceReduced} animationDuration={900}>{data.map(item => <Cell key={item.name} fill={["var(--ws-accent)", "var(--ws-blue)", "var(--ws-chart-secondary)", "var(--ws-gold)", "var(--ws-dim)"][data.indexOf(item) % 5]} />)}</Bar></BarChart></ResponsiveContainer></div>;
}

export function ReceivablesChart({ data }: { data: Breakdown[] }) {
  const reduced = useReducedMotion(); const workspaceReduced = useWorkspaceMotion();
  return <div className={styles.receivablesVisual}><div className={styles.donut} aria-label="Distribución de cuentas por cobrar"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 190, height: 170 }}><PieChart accessibilityLayer><Pie data={data} dataKey="amount" nameKey="name" innerRadius="74%" outerRadius="94%" paddingAngle={3} stroke="none" isAnimationActive={!reduced && !workspaceReduced} animationDuration={900}>{data.map(item => <Cell key={item.name} fill={["var(--ws-accent)", "var(--ws-blue)", "var(--ws-chart-secondary)", "var(--ws-gold)", "var(--ws-dim)"][data.indexOf(item) % 5]} />)}</Pie><Tooltip formatter={value => money(Number(value))} contentStyle={tooltipStyle} itemStyle={{ color: "var(--ws-text)" }} /></PieChart></ResponsiveContainer><div className={styles.donutLabel}><strong>Cartera</strong><span>Estado de cuentas</span></div></div><dl className={styles.legend}>{data.map(item => <div key={item.name}><dt><i style={{ background: ["var(--ws-accent)", "var(--ws-blue)", "var(--ws-chart-secondary)", "var(--ws-gold)", "var(--ws-dim)"][data.indexOf(item) % 5] }} />{item.name}</dt><dd>{money(item.amount)}</dd></div>)}</dl></div>;
}
