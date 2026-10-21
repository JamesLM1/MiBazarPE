import Link from "next/link";
import { Construction } from "lucide-react";
import { getPrivateContext } from "@/features/dashboard/context";
import styles from "./dashboard.module.css";

export async function ModulePlaceholder({ title }: { title: string }) {
  await getPrivateContext();
  return <section className={styles.placeholder}><Construction size={34} strokeWidth={1.4} aria-hidden="true" /><h1>{title}</h1><h2>Módulo en preparación</h2><p>Este espacio estará disponible en una próxima etapa. Puedes seguir consultando el resumen de tu negocio.</p><Link className={styles.primary} href="/dashboard">Volver al Dashboard</Link></section>;
}
