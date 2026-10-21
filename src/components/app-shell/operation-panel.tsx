"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";
import { ArrowUpRight, Plus, X } from "lucide-react";
import type { ModuleRow } from "@/features/operations/module-data";
import styles from "./operations-panels.module.css";

export function OperationComposer({ title, children }: { title: string; children: ReactNode }) {
  const parameters = useSearchParams();
  const pathname = usePathname();
  const [open, setOpen] = useState(parameters.get("nuevo") === "1");
  useEffect(() => {
    const request = (event: Event) => { if ((event as CustomEvent<string>).detail === pathname) setOpen(true); };
    window.addEventListener("mibazarpe:compose", request);
    return () => window.removeEventListener("mibazarpe:compose", request);
  }, [pathname]);
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button type="button" className={styles.createButton}><Plus size={16} aria-hidden="true" />{title}</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={`${styles.panel} ${styles.composer}`} onInteractOutside={event => event.preventDefault()}><div className={styles.panelHeading}><div><p>NUEVA OPERACIÓN</p><Dialog.Title>{title}</Dialog.Title><Dialog.Description>Completa los datos y revisa la información antes de confirmar.</Dialog.Description></div><Dialog.Close className={styles.close} aria-label="Cerrar formulario"><X size={19} /></Dialog.Close></div><div className={styles.panelBody}>{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function RecordDetails({ record, columns }: { record: ModuleRow; columns: string[] }) {
  const identityIndex = ["Producto", "Cliente", "Proveedor", "Concepto", "Mes"].map(label => columns.indexOf(label)).find(index => index >= 0) ?? 0;
  return <Dialog.Root><Dialog.Trigger asChild><button type="button" className={styles.detailButton}>Ver detalle <ArrowUpRight size={14} aria-hidden="true" /></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.panel}><div className={styles.panelHeading}><div><p>FICHA DEL REGISTRO</p><Dialog.Title>{record.cells[identityIndex] || "Detalle de operación"}</Dialog.Title><Dialog.Description>Consulta la información sin perder tu posición en el listado.</Dialog.Description></div><Dialog.Close className={styles.close} aria-label="Cerrar detalle"><X size={19} /></Dialog.Close></div><div className={styles.panelBody}><dl className={styles.recordFacts}>{columns.map((column, index) => <div key={`${column}-${index}`}><dt>{column}</dt><dd>{record.cells[index] ?? "—"}</dd></div>)}</dl>{record.details.map((detail, index) => <section className={styles.extendedDetail} key={`${detail.label}-${index}`}><h3>{detail.label}</h3><p>{detail.value || "—"}</p></section>)}</div><footer className={styles.panelFooter}>{record.href && <Link className={styles.createButton} href={record.href}>Abrir ficha completa <ArrowUpRight size={15} aria-hidden="true" /></Link>}<Dialog.Close className={styles.secondaryButton}>Volver al listado</Dialog.Close></footer></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
