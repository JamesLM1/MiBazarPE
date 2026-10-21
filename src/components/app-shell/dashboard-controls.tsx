"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, LoaderCircle } from "lucide-react";
import { periods } from "@/features/dashboard/model";
import type { Period } from "@/features/dashboard/types";
import styles from "./dashboard.module.css";

export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Hola");
  useEffect(() => {
    const hour = new Date().getHours();
    const salutation = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
    // Clock depends on the browser timezone, not the server rendering timezone.
    const frame = requestAnimationFrame(() => setGreeting(salutation));
    return () => cancelAnimationFrame(frame);
  }, []);
  return <h1>{greeting}, <span>{name.split(/\s+/)[0]}</span></h1>;
}
export function PeriodSelect({ period }: { period: Period }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className={styles.period} aria-busy={pending}>
    {pending ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" /> : <CalendarDays size={16} aria-hidden="true" />}
    <select aria-label="Período del dashboard" value={period} disabled={pending} onChange={event => { const value = event.target.value; startTransition(() => router.replace(`/dashboard?periodo=${value}`, { scroll: false })); }}>{periods.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <ChevronDown size={14} aria-hidden="true" /><span role="status" className={styles.srOnly}>{pending ? "Actualizando período" : ""}</span>
  </div>;
}
