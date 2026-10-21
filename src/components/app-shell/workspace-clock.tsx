"use client";

import { useEffect, useState } from "react";
import styles from "./app-shell.module.css";

export function WorkspaceClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const interval = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(interval); }, []);
  return <div className={styles.workspaceClock} aria-label="Hora de Lima"><time dateTime={now.toISOString()} suppressHydrationWarning>{new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit", timeZone: "America/Lima" }).format(now)}</time><span suppressHydrationWarning>{new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Lima" }).format(now)}</span></div>;
}
