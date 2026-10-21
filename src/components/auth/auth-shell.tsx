"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { AuthMascot } from "./auth-mascot";
import { AuthBackground } from "./auth-background";
import type { AuthMascotState, AuthMode } from "@/features/auth/types";
import styles from "./auth.module.css";

const VisualState = createContext<Dispatch<SetStateAction<AuthMascotState>> | null>(null);
export function useAuthVisualState() { return useContext(VisualState); }

export function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mode: AuthMode = pathname === "/registro" ? "register" : pathname === "/recuperar-contrasena" ? "recover" : pathname === "/actualizar-contrasena" ? "reset" : "login";
  const [mascotState, setMascotState] = useState<AuthMascotState>("idle");
  return <VisualState.Provider value={setMascotState}>
    <main className={styles.screen} data-register={mode === "register"} data-auth-mode={mode}>
      <AuthBackground />
      <aside className={styles.visualPanel} aria-label="Bienvenido a MiBazarPE">
        <Link href="/" className={`${styles.brand} ${styles.link}`} aria-label="MiBazarPE — Inicio">
          <Image src="/brand/mibazarpe-logo.png" alt="MiBazarPE" width={2172} height={724} unoptimized className="h-auto w-36" />
        </Link>
        <div className={styles.characterStage}>
          <AuthMascot mode={mode} state={mascotState} />
        </div>
        <div className={styles.panelCopy}>
          <p>Tu negocio, más claro<br />desde el inicio.</p>
          <p>Ventas, inventario, clientes, créditos y caja.<br />Todo conectado, en un solo lugar.</p>
        </div>
      </aside>
      <section className={styles.formPanel} aria-label={mode === "register" ? "Crear cuenta" : "Acceso a MiBazarPE"}>
        <Link href="/" className={`${styles.homeLink} ${styles.link}`}><ChevronLeftIcon size={16} aria-hidden="true" /> Inicio</Link>
        {children}
      </section>
    </main>
  </VisualState.Provider>;
}
