"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavigationMenu } from "radix-ui";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./mobile-nav";
import { LanguagePicker, ThemeQuickToggle } from "./landing-controls";
import { useLandingPreferences } from "./landing-preferences";
import { Localized } from "./localized";
import styles from "./header-menu.module.css";

const menus = [
  { label: "Funciones", primaryTitle: "Todo tu negocio", primary: [["Explorar funciones", "/#funciones"], ["Ventas e inventario", "/#funciones"], ["Clientes y créditos", "/#como-funciona"], ["Reportes y caja", "/#como-funciona"]], secondaryTitle: "Explora MiBazarPE", secondary: [["Cómo funciona", "/#como-funciona"], ["Planes", "/#planes"], ["Casos de uso", "/#casos-ilustrativos"]], note: "Ventas, inventario y clientes. El contexto de tu negocio, reunido en un mismo lugar." },
  { label: "Cómo funciona", primaryTitle: "Una mirada al producto", primary: [["Ver el recorrido", "/#como-funciona"], ["Detrás del mostrador", "/#historia-bazar"], ["Lo que buscamos facilitar", "/#casos-ilustrativos"]], secondaryTitle: "Para comenzar", secondary: [["Funciones previstas", "/#funciones"], ["Preguntas frecuentes", "/#preguntas-frecuentes"], ["Contacto", "/#contacto"]], note: "Conoce la propuesta de MiBazarPE y recorre las operaciones de un pequeño comercio." },
  { label: "Nosotros", primaryTitle: "Conoce al equipo", primary: [["El equipo detrás de MiBazarPE", "/#nosotros"], ["La tecnología del proyecto", "/#integraciones"], ["Contáctanos", "/#contacto"]], secondaryTitle: "Información", secondary: [["Sobre el proyecto", "/#nosotros"], ["Términos y condiciones", "/legal/terminos"], ["Política de privacidad", "/legal/privacidad"]], note: "Una iniciativa que busca dar más claridad a la gestión diaria de pequeños negocios." },
] as const;

/** Existing compact sticky header, extended with Apple-style mega menus. */
export function Header() {
  const scrolled = useScroll(10);
  const [open, setOpen] = useState("");
  const { t } = useLandingPreferences();
  return <Localized>
    {open && <div className={styles.backdrop} aria-hidden="true" onPointerDown={() => setOpen("")} />}
    <header className={styles.header} data-scrolled={scrolled} data-expanded={Boolean(open)}>
      <div className={styles.bar}>
        <Link aria-label="MiBazarPE — Inicio" className={styles.brand} href="/#inicio" onClick={() => setOpen("")}><Image src="/brand/mibazarpe-logo.png" alt="MiBazarPE" width={2172} height={724} unoptimized loading="eager" className="h-auto w-24" /></Link>
        <NavigationMenu.Root value={open} onValueChange={setOpen} delayDuration={100} skipDelayDuration={200} style={{position:"static"}} className={styles.desktop} aria-label={t("Navegación principal")}>
          <NavigationMenu.List className={styles.list}>
            <NavigationMenu.Item><NavigationMenu.Link asChild><Link href="/#inicio" className={styles.navLink}>Inicio</Link></NavigationMenu.Link></NavigationMenu.Item>
            {menus.map(menu => <NavigationMenu.Item key={menu.label} value={menu.label}>
              <NavigationMenu.Trigger className={styles.navLink}>{menu.label}<ChevronDown size={11} className={styles.chevron} aria-hidden="true" /></NavigationMenu.Trigger>
              <NavigationMenu.Content className={styles.panel}>
                <div className={styles.columns}>
                  <div><p className={styles.columnLabel}>{menu.primaryTitle}</p><ul className={styles.primaryLinks}>{menu.primary.map(([label, href], index) => <li key={label} style={{ animationDelay: `${index * 35}ms` }}><NavigationMenu.Link asChild><Link href={href} onClick={() => setOpen("")}>{label}</Link></NavigationMenu.Link></li>)}</ul></div>
                  <div><p className={styles.columnLabel}>{menu.secondaryTitle}</p><ul className={styles.secondaryLinks}>{menu.secondary.map(([label, href], index) => <li key={label} style={{ animationDelay: `${index * 35 + 35}ms` }}><NavigationMenu.Link asChild><Link href={href} onClick={() => setOpen("")}>{label}<ArrowUpRight size={12} aria-hidden="true" /></Link></NavigationMenu.Link></li>)}</ul></div>
                  <div className={styles.note}><span>MiBazarPE</span><p>{menu.note}</p><NavigationMenu.Link asChild><Link href="/#contacto" onClick={() => setOpen("")}>Hablemos de tu negocio<ArrowUpRight size={15} aria-hidden="true" /></Link></NavigationMenu.Link></div>
                </div>
              </NavigationMenu.Content>
            </NavigationMenu.Item>)}
            <NavigationMenu.Item><NavigationMenu.Link asChild><Link href="/#preguntas-frecuentes" className={styles.navLink}>Preguntas frecuentes</Link></NavigationMenu.Link></NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>
        <div className={styles.actions}><div className={styles.auth}><Button asChild size="sm" variant="outline"><Link href="/login" prefetch={false}>Iniciar sesión</Link></Button><Button asChild size="sm"><Link href="/registro" prefetch={false}>Comenzar</Link></Button></div><LanguagePicker /><ThemeQuickToggle /><MobileNav /></div>
      </div>
    </header>
  </Localized>;
}
