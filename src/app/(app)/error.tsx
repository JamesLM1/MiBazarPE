"use client";
import { CircleAlert } from "lucide-react";
import styles from "@/components/app-shell/dashboard.module.css";

export default function PrivateError({ reset }: { reset: () => void }) {
  return <div className={styles.placeholder} role="alert"><CircleAlert size={32} /><h1>No pudimos cargar esta vista</h1><p>Tu información sigue protegida. Intenta cargarla de nuevo.</p><button type="button" className={styles.primary} onClick={reset}>Volver a intentar</button></div>;
}
