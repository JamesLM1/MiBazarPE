"use client";

import { useId, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { ModuleRow } from "@/features/operations/module-data";
import { SelectionPill } from "./workspace-selection";
import { RecordDetails } from "./operation-panel";
import styles from "./operations-panels.module.css";

function isoDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== iso ? null : iso;
}
const dayKey = (date: Date) => date.toISOString().slice(0, 10);
const dayLabel = (date: Date) => new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", timeZone: "UTC" }).format(date);

export function OperationsAgenda({ rows, columns, dateIndex }: { rows: ModuleRow[]; columns: string[]; dateIndex: number }) {
  const overviewId = useId();
  const dated = rows.map(row => ({ row, date: isoDate(row.cells[dateIndex] ?? "") })).filter((item): item is { row: ModuleRow; date: string } => item.date !== null);
  const [selection, setSelection] = useState(dated[0]?.date ?? "");
  const [month, setMonth] = useState((dated[0]?.date ?? new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date())).slice(0, 7));
  const [mode, setMode] = useState("month");
  const first = new Date(`${month}-01T12:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12)).getUTCDate();
  const calendarDays = Math.ceil((offset + daysInMonth) / 7) * 7;
  const selected = dated.filter(item => item.date === selection);
  const countByDate = new Map<string, number>(); dated.forEach(item => countByDate.set(item.date, (countByDate.get(item.date) ?? 0) + 1));
  const datesWithRecords = [...countByDate].sort(([a], [b]) => a.localeCompare(b));
  const largestDay = Math.max(1, ...countByDate.values());
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date());
  const titleIndex = ["Cliente", "Proveedor", "Concepto"].map(column => columns.indexOf(column)).find(index => index >= 0) ?? 0;
  const amountIndex = ["Saldo", "Total", "Monto"].map(column => columns.indexOf(column)).find(index => index >= 0) ?? -1;
  const weekAnchor = selection.startsWith(month) ? new Date(`${selection}T12:00:00Z`) : first;
  const weekStart = new Date(weekAnchor); weekStart.setUTCDate(weekAnchor.getUTCDate() - (weekAnchor.getUTCDay() + 6) % 7);
  function moveMonth(step: number) { const next = new Date(first); next.setUTCMonth(next.getUTCMonth() + step); const nextMonth = dayKey(next).slice(0, 7); setMonth(nextMonth); setSelection(dated.find(item => item.date.startsWith(nextMonth))?.date ?? dayKey(next)); }
  function movePeriod(step: number) {
    if (mode === "month") { moveMonth(step); return; }
    const next = new Date(weekAnchor); next.setUTCDate(next.getUTCDate() + step * 7);
    const key = dayKey(next); setMonth(key.slice(0, 7)); setSelection(key);
  }
  return <div className={styles.agendaWorkspace}>
    <div className={styles.calendarColumn}>
      <section className={styles.calendarPanel} aria-label="Calendario de registros">
        <div className={styles.calendarToolbar}><h3>{new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}</h3><div className={styles.calendarActions}><button type="button" onClick={() => movePeriod(-1)} aria-label={mode === "month" ? "Mes anterior" : "Semana anterior"}><ChevronLeft size={16} /></button><button type="button" onClick={() => { setMonth(today.slice(0, 7)); setSelection(today); }}>Hoy</button><button type="button" onClick={() => movePeriod(1)} aria-label={mode === "month" ? "Mes siguiente" : "Semana siguiente"}><ChevronRight size={16} /></button></div></div>
        <div className={styles.calendarModes} role="group" aria-label="Presentación del calendario"><button type="button" aria-pressed={mode === "month"} onClick={() => setMode("month")}>{mode === "month" && <SelectionPill group="calendar" />}Mes</button><button type="button" aria-pressed={mode === "week"} onClick={() => setMode("week")}>{mode === "week" && <SelectionPill group="calendar" />}Semana</button></div>
        <div className={styles.monthGrid} key={`${month}:${mode}:${mode === "week" ? dayKey(weekStart) : ""}`} data-mode={mode} aria-label="Calendario de registros de esta página">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => <span className={styles.weekday} key={day}>{day}</span>)}{Array.from({ length: mode === "month" ? calendarDays : 7 }, (_, index) => { const date = mode === "month" ? new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), index - offset + 1, 12)) : new Date(weekStart.valueOf() + index * 86400000); const key = dayKey(date), count = countByDate.get(key) ?? 0; return <button type="button" key={key} className={styles.calendarDay} data-outside={!key.startsWith(month)} aria-current={key === today ? "date" : undefined} aria-pressed={selection === key} aria-label={`${dayLabel(date)}, ${count} registros de esta página`} onClick={() => { setSelection(key); if (!key.startsWith(month)) setMonth(key.slice(0, 7)); }}><span>{date.getUTCDate()}</span>{count > 0 && <small>{count}<span> {count === 1 ? "registro" : "registros"}</span></small>}</button>; })}</div>
        <p className={styles.calendarScope}>Calendario de esta página · {dated.length} registros con fecha · no cambia estados ni registra pagos.</p>
      </section>
      <section className={styles.calendarOverview} aria-labelledby={overviewId}>
        <header><div><h3 id={overviewId}>Fechas con registros</h3><p>Distribución de esta página. Elige una fecha para abrir su agenda.</p></div><b>{datesWithRecords.length}<small>{datesWithRecords.length === 1 ? "fecha" : "fechas"}</small></b></header>
        <div className={styles.calendarDateList}>{datesWithRecords.map(([date, count]) => <button type="button" key={date} aria-pressed={selection === date} onClick={() => { setMonth(date.slice(0, 7)); setSelection(date); }}><span>{dayLabel(new Date(`${date}T12:00:00Z`))}</span><i aria-hidden="true"><i style={{ width: `${count / largestDay * 100}%` }} /></i><strong>{count}<small> {count === 1 ? "registro" : "registros"}</small></strong></button>)}</div>
        {!datesWithRecords.length && <p className={styles.calendarEmpty}>Esta página no contiene registros con una fecha válida.</p>}
      </section>
    </div>
    <section className={styles.dayAgenda} aria-label="Registros del día seleccionado">
      <div className={styles.dayAgendaHeading} aria-live="polite"><CalendarDays size={19} aria-hidden="true" /><div><span>{columns[dateIndex]}</span><h3>{selection ? dayLabel(new Date(`${selection}T12:00:00Z`)) : "Selecciona un día"}</h3></div><b>{selected.length}</b></div>
      <p className={styles.agendaHint}>{selected.length > 3 ? "Desplázate en esta lista para consultar todos los registros del día." : "Registros de la página cargada."}</p>
      <div className={styles.agendaList} key={selection} tabIndex={selected.length > 3 ? 0 : undefined} role="region" aria-label={`Detalle de ${selected.length} registros del día seleccionado`}>{selected.length ? selected.map(({ row }) => <article key={row.id} className={styles.agendaRecord}><p>{row.cells[titleIndex]}</p>{amountIndex >= 0 && <strong>{row.cells[amountIndex]}</strong>}<RecordDetails record={row} columns={columns} /></article>) : <p className={styles.calendarEmpty}>No hay registros cargados para este día. Elige una fecha con registros o consulta otra página del listado.</p>}</div>
    </section>
  </div>;
}
