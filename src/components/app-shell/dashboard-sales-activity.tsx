"use client";

import { useState } from "react";
import { ArrowRight, Clock3, TrendingUp } from "lucide-react";
import type { FinancialOverview, SalesPoint } from "@/features/dashboard/presentation";
import { money } from "@/features/dashboard/model";
import styles from "./dashboard-insights.module.css";

function ActivityValues({ rows }: { rows: SalesPoint[] }) {
  return <details className={styles.data}><summary>Ver datos de actividad</summary><div><table><caption>Importe vendido en la serie seleccionada · PEN</caption><thead><tr><th>Período</th><th>Importe</th></tr></thead><tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>{money(row.amount)}</td></tr>)}</tbody></table></div></details>;
}

export function SalesActivity({ overview }: { overview: FinancialOverview }) {
  const [pulsePeriod, setPulsePeriod] = useState<"week" | "month">("week");
  const [activityPeriod, setActivityPeriod] = useState<"day" | "month">("day");
  const [selected, setSelected] = useState<string | null>(null);
  const pulse = overview.sales[pulsePeriod].filter(row => Number.isFinite(row.amount));
  const activity = overview.sales[activityPeriod].filter(row => Number.isFinite(row.amount));
  const monthHasSales = overview.sales.month.some(row => row.amount > 0);
  const pulseMax = Math.max(0, ...pulse.map(row => row.amount));
  const activityMax = Math.max(0, ...activity.map(row => row.amount));
  const active = activity.find(row => row.label === selected);
  return <>
    <section className={styles.card} aria-label="Pulso de ventas"><header><div><h3><TrendingUp size={17} />Pulso de ventas</h3><p>{pulsePeriod === "week" ? "Importe vendido en los últimos 7 días" : "Importe vendido por día de este mes"}</p></div><div className={styles.tabs} role="group" aria-label="Período del pulso de ventas"><button type="button" aria-pressed={pulsePeriod === "week"} onClick={() => setPulsePeriod("week")}>7 días</button><button type="button" aria-pressed={pulsePeriod === "month"} onClick={() => setPulsePeriod("month")}>Mes</button></div></header>
      {pulseMax > 0 ? <div className={styles.pulse} key={pulsePeriod}>{pulse.map((row, index) => <div key={row.label}><div className={styles.pulseTrack} tabIndex={0} role="img" aria-label={`${row.label}: ${money(row.amount)}`}><span style={{ minHeight: row.amount > 0 ? 3 : 0, height: `${row.amount / pulseMax * 100}%`, background: row.amount === pulseMax ? "var(--ws-accent)" : "var(--ws-chart-secondary)" }} /><small>{money(row.amount)}</small></div><b data-sparse={pulse.length > 10 && index % 6 !== 0 && index !== pulse.length - 1}>{row.label}</b></div>)}</div> : <div className={styles.zeroState}><TrendingUp size={25} aria-hidden="true" /><strong>{pulse.length ? "Sin ventas en esta selección" : "Información no disponible"}</strong><p>{pulse.length ? pulsePeriod === "week" ? "No se registraron ventas en los últimos 7 días." : "No se registraron ventas este mes." : "No pudimos obtener la serie de ventas."}</p>{pulsePeriod === "week" && monthHasSales && <button type="button" onClick={() => setPulsePeriod("month")}>Ver movimiento de este mes <ArrowRight size={14} aria-hidden="true" /></button>}</div>}
      <ActivityValues rows={pulse} /><p className={styles.scope}>Cada valor corresponde al importe vendido en su fecha, sin proyecciones.</p>
    </section>
    <section className={styles.card} aria-label="Actividad de ventas"><header><div><h3><Clock3 size={17} />{activityPeriod === "day" ? "Actividad por hora" : "Calendario de ventas"}</h3><p>{activityPeriod === "day" ? "Intensidad de ventas de hoy" : "Intensidad por día de este mes"}</p></div><div className={styles.tabs} role="group" aria-label="Período de actividad"><button type="button" aria-pressed={activityPeriod === "day"} onClick={() => { setActivityPeriod("day"); setSelected(null); }}>Hoy</button><button type="button" aria-pressed={activityPeriod === "month"} onClick={() => { setActivityPeriod("month"); setSelected(null); }}>Mes</button></div></header>
      <div className={styles.hourValue} aria-live="polite"><strong>{activity.length ? money(active?.amount ?? activityMax) : "—"}</strong><span>{active ? `${activityPeriod === "day" ? "a las" : "el"} ${active.label}` : activityMax ? activityPeriod === "day" ? "mayor importe en una hora" : "mayor importe en un día" : activity.length ? activityPeriod === "day" ? "sin ventas registradas hoy" : "sin ventas registradas este mes" : "información no disponible"}</span></div>
      <div className={styles.heatmap} role="group" aria-label={activityPeriod === "day" ? "Ventas por hora de hoy" : "Ventas por día del mes"}>{activity.map(row => <button key={`${activityPeriod}-${row.label}`} type="button" onMouseEnter={() => setSelected(row.label)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(row.label)} onBlur={() => setSelected(null)} onClick={() => setSelected(row.label)} aria-label={`${row.label}: ${money(row.amount)}`} aria-pressed={selected === row.label} style={{ background: row.amount > 0 ? `color-mix(in srgb,var(--ws-accent) ${Math.max(20, Math.round(row.amount / activityMax * 100))}%,var(--ws-well))` : "var(--ws-well)" }}><span>{row.label.split(activityPeriod === "day" ? ":" : "/")[0]}</span></button>)}</div>
      <div className={styles.heatLegend}><span>Menos actividad</span><i /><i /><i /><i /><span>Más actividad</span></div><p className={styles.scope}>{activity.length ? activityMax ? "Pasa el cursor, toca una celda o recórrelas con el teclado." : activityPeriod === "day" && monthHasSales ? "Hoy no hay ventas; consulta Mes para ver los días con movimiento." : "La serie está disponible y sus importes están en cero." : "La actividad aparecerá cuando se pueda consultar el registro de ventas."}</p>
    </section>
  </>;
}
