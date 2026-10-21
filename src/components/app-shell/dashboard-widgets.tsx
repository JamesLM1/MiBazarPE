"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock3, Package, PackageCheck, Pause, Play, RotateCcw } from "lucide-react";
import type { DashboardData } from "@/features/dashboard/types";
import type { DuePayment, FinancialOverview } from "@/features/dashboard/presentation";
import { money } from "@/features/dashboard/model";
import styles from "./dashboard.module.css";

export function DashboardAgenda({ items, synthetic }: { items: DuePayment[]; synthetic: boolean }) {
  const [kind, setKind] = useState("all");
  const [selectedDate, setDate] = useState("");
  const dates = [...new Set(items.map(item => item.date))].sort();
  const activeDate = dates.includes(selectedDate) ? selectedDate : "";
  const filtered = items.filter(item => (kind === "all" || kind === item.kind) && (!activeDate || item.date === activeDate));
  return <section id="vencimientos" className={`${styles.card} ${styles.dueCard}`}>
    <header className={styles.cardHeader}><div><p className={styles.sectionLabel}>TU AGENDA</p><h2>Próximos vencimientos</h2><p>Cuotas y compromisos con proveedores{synthetic ? " · DEMO" : ""}</p></div><CalendarDays size={19} aria-hidden="true" /></header>
    <div className={styles.agendaFilters} role="group" aria-label="Tipo de vencimiento">{[["all", "Todos"], ["receivable", "Por cobrar"], ["payable", "Por pagar"]].map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => setKind(value)}>{label}</button>)}</div>
    {dates.length > 1 && <div className={styles.dateStrip} role="group" aria-label="Fecha de vencimiento"><button type="button" aria-pressed={!activeDate} onClick={() => setDate("")}>Todas<small>las fechas</small></button>{dates.map(date => <button type="button" key={date} aria-pressed={activeDate === date} onClick={() => setDate(date)}><time dateTime={date}>{date.slice(8)}</time><small>{new Intl.DateTimeFormat("es-PE", { month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}</small></button>)}</div>}
    <div aria-live="polite" className={styles.agendaBody} role="region" aria-label="Lista de próximos vencimientos" tabIndex={0}>{filtered.length ? <ul className={styles.dueList}>{filtered.map(item => <li key={item.id}><Link href={item.kind === "receivable" ? "/cuentas-por-cobrar" : "/cuentas-por-pagar"} className={styles.dueItem}><span className={styles.dueIcon} data-kind={item.kind}>{item.kind === "receivable" ? <ArrowDownLeft size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}</span><div><strong>{item.name}</strong><p>{item.detail}</p><time dateTime={item.date}>{item.date.slice(8)}/{item.date.slice(5, 7)}/{item.date.slice(0, 4)}</time></div><strong className={styles.dueAmount}>{money(Number(item.amount))}</strong><span className={styles.dueStatus}>{item.kind === "receivable" ? "Por cobrar" : "Por pagar"} · {item.status}</span></Link></li>)}</ul> : <div className={styles.agendaEmpty}><CalendarDays size={26} strokeWidth={1.4} aria-hidden="true" /><h3>{items.length ? "Sin vencimientos en esta selección" : "Tu agenda, al día"}</h3><p>{items.length ? "Prueba otro tipo de compromiso o consulta todas las fechas." : "Aquí aparecerán las cuotas y cuentas por pagar cuando sus registros estén disponibles."}</p></div>}</div>
    <Link className={styles.cardLink} href="/cuentas-por-cobrar?vista=cronograma">Ver cronograma <ArrowRight size={14} aria-hidden="true" /></Link>
  </section>;
}

export function InventoryWidget({ data, demo, lowStock }: { data: DashboardData; demo: boolean; lowStock: number | null }) {
  const inventory = demo ? null : data.inventory;
  const percent = inventory && inventory.total > 0 ? Math.round(inventory.normal / inventory.total * 100) : null;
  return <section className={`${styles.card} ${styles.inventoryCard}`}><header className={styles.cardHeader}><div><p className={styles.sectionLabel}>CONTROL DEL CATÁLOGO</p><h2>Salud del inventario</h2><p>{demo ? "Ejemplo de presentación · DEMO" : "Existencias frente al stock mínimo"}</p></div><Package size={19} aria-hidden="true" /></header><div className={styles.stockHealth}><div className={styles.stockHealthMain}><span className={styles.healthIcon}><PackageCheck size={24} strokeWidth={1.5} aria-hidden="true" /></span><div><strong>{inventory ? inventory.total : demo ? lowStock : "—"}</strong><span>{inventory ? "productos en el catálogo" : demo ? "productos requieren reposición" : "Información no disponible"}</span></div>{percent !== null && <b>{percent}%<small>con stock suficiente</small></b>}</div>
      {percent !== null && <div className={styles.stockGauge}><svg viewBox="0 0 220 130" role="img" aria-label={`${percent}% de productos con stock suficiente`}><path d="M20 110 A90 90 0 0 1 200 110" pathLength="100" fill="none" stroke="var(--ws-fill-hover)" strokeWidth="20" strokeLinecap="round" /><path d="M20 110 A90 90 0 0 1 200 110" pathLength="100" fill="none" stroke="var(--ws-accent)" strokeWidth="20" strokeLinecap="round" strokeDasharray={`${percent} 100`} /></svg><div><strong>{percent}%</strong><small>stock suficiente</small></div></div>}{inventory && inventory.total > 0 && <><div className={styles.stockSegments} role="img" aria-label={`${inventory.normal} productos con stock suficiente, ${inventory.low} con stock bajo, ${inventory.empty} agotados`}><span style={{ width: `${inventory.normal / inventory.total * 100}%` }} /><span style={{ width: `${inventory.low / inventory.total * 100}%` }} /><span style={{ width: `${inventory.empty / inventory.total * 100}%` }} /></div><div className={styles.stockLegend}><span>Suficiente <strong>{inventory.normal}</strong></span><span>Bajo <strong>{inventory.low}</strong></span><span>Agotado <strong>{inventory.empty}</strong></span></div></>}
      {inventory?.alerts.slice(0, 6).map(product => <Link href={`/inventario/${product.id_producto}`} key={product.id_producto} className={styles.stockAlert}><div><strong>{product.nombre}</strong><small>Mínimo: {product.stock_minimo}</small></div><span data-empty={product.stock_actual === 0}>{product.stock_actual} unidades</span><ArrowUpRight size={14} aria-hidden="true" /></Link>)}
      {!inventory && <p className={styles.widgetHint}>{demo ? "Esta vista de ejemplo está separada del inventario de tu negocio." : "Las alertas aparecerán cuando se pueda consultar tu inventario."}</p>}
    </div><Link href="/inventario" className={styles.cardLink}>Explorar inventario <ArrowRight size={14} aria-hidden="true" /></Link></section>;
}

export function RecentActivity({ data, demo }: { data: DashboardData; demo: boolean }) {
  const activity = demo ? [] : data.activity.slice(0, 4);
  return <section className={styles.card}><header className={styles.cardHeader}><div><p className={styles.sectionLabel}>ÚLTIMOS REGISTROS</p><h2>Actividad de tu negocio</h2><p>Últimas altas disponibles, con su fecha de registro</p></div><Clock3 size={18} aria-hidden="true" /></header><div className={styles.activityList}>{activity.length ? activity.map(item => <Link className={styles.activityItem} key={`${item.kind}-${item.id}`} href={item.kind === "product" ? `/inventario/${item.id}` : `/clientes/${item.id}`}><span className={styles.activityMarker} /><div><strong>{item.name}</strong><p>{item.kind === "product" ? "Producto registrado" : "Cliente registrado"}</p></div><time dateTime={item.date}>{new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Lima" }).format(new Date(item.date))}</time><ArrowUpRight size={14} aria-hidden="true" /></Link>) : <div className={styles.agendaEmpty}><Clock3 size={25} aria-hidden="true" /><h3>{demo ? "Tu actividad tendrá su lugar aquí" : data.activityError ? "Actividad no disponible" : "Todo empieza con el primer registro"}</h3><p>{data.activityError && !demo ? "No pudimos consultar la actividad. Puedes seguir explorando los módulos del negocio." : "Los productos y clientes aparecerán aquí, con acceso directo a sus fichas."}</p></div>}{activity.length > 0 && <p className={styles.activityScope}>{data.activityError ? "Solo pudimos recuperar parte de los registros." : "Se muestran las últimas altas de productos y clientes; no solo las de hoy."}</p>}</div><Link href="/clientes" className={styles.cardLink}>Explorar clientes <ArrowRight size={14} aria-hidden="true" /></Link></section>;
}

export function BalanceSnapshot({ overview }: { overview: FinancialOverview }) {
  const amounts = [overview.receivables, overview.payables].map(value => value == null || value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0 ? null : Number(value));
  const largest = Math.max(0, ...amounts.filter((value): value is number => value !== null));
  return <section className={`${styles.card} ${styles.balanceCard}`} aria-label="Comparación de saldos pendientes"><header className={styles.cardHeader}><div><p className={styles.sectionLabel}>TUS COMPROMISOS</p><h2>Saldos pendientes</h2><p>Situación actual · Soles (PEN)</p></div><ArrowUpRight size={18} aria-hidden="true" /></header><div className={styles.balanceBody}>{([{ label: "Por cobrar", href: "/cuentas-por-cobrar" }, { label: "Por pagar", href: "/cuentas-por-pagar" }] as const).map((row, index) => <Link key={row.href} href={row.href} className={styles.balanceRow}><span>{row.label}<strong>{amounts[index] === null ? "—" : money(amounts[index])}</strong></span><span className={styles.balanceTrack} aria-hidden="true"><i data-kind={index} style={{ width: `${largest && amounts[index] !== null ? amounts[index] / largest * 100 : 0}%` }} /></span></Link>)}<p>Compara saldos registrados. No representa efectivo disponible ni una proyección de caja.</p></div></section>;
}

export function FocusTimer() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const accumulated = useRef(0);
  const started = useRef(0);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setElapsed(accumulated.current + Date.now() - started.current), 500);
    return () => window.clearInterval(interval);
  }, [running]);
  function toggle() {
    if (running) { accumulated.current += Date.now() - started.current; setElapsed(accumulated.current); }
    else started.current = Date.now();
    setRunning(!running);
  }
  function reset() { setRunning(false); accumulated.current = 0; started.current = 0; setElapsed(0); }
  const seconds = Math.floor(elapsed / 1000);
  const display = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
  return <section className={styles.focusTimer} aria-label="Temporizador de trabajo"><header><Clock3 size={15} aria-hidden="true" /><h2>Tu tiempo de enfoque</h2><span>{running ? "En marcha" : "En pausa"}</span></header><p className={styles.timerDigits} aria-label={`${Math.floor(seconds / 60)} minutos y ${seconds % 60} segundos`}>{display}</p><div className={styles.timerControls}><button type="button" onClick={toggle} aria-label={running ? "Pausar temporizador" : "Iniciar temporizador"}>{running ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}{running ? "Pausar" : "Iniciar"}</button><button type="button" onClick={reset} aria-label="Reiniciar temporizador"><RotateCcw size={17} aria-hidden="true" /></button></div><small>Herramienta personal · no registra turnos ni movimientos de caja</small></section>;
}
