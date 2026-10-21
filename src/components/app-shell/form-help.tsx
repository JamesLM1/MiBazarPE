"use client";
import { Popover } from "radix-ui";
import { CircleHelp, X } from "lucide-react";
import styles from "./form-help.module.css";

export function FormHelp({ children, title = "Ayuda para completar el formulario" }: { children: React.ReactNode; title?: string }) {
  return <Popover.Root><Popover.Trigger asChild><button type="button" className={styles.trigger} aria-label={title}><CircleHelp size={18} aria-hidden="true"/><span>Ayuda</span></button></Popover.Trigger><Popover.Portal><Popover.Content className={styles.content} sideOffset={8} collisionPadding={16}><h3>{title}</h3><div>{children}</div><Popover.Close className={styles.close} aria-label="Cerrar ayuda"><X size={16}/></Popover.Close><Popover.Arrow className={styles.arrow}/></Popover.Content></Popover.Portal></Popover.Root>;
}
