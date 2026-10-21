"use client";
import { Localized } from "./localized";


import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./footer.module.css";
import { ElectricWordmark } from "./electric-wordmark";
import { Newsletter } from "./newsletter";
import { legalLinks, companySocialUrls, marketingContact } from "@/lib/marketing-config";
import { ThemeControls } from "./landing-controls";

const networks = ["X", "LinkedIn", "Discord", "YouTube", "Facebook", "Instagram"] as const;
type Network = (typeof networks)[number];
const groups = [
  { title: "Producto", links: [["Funciones", "/#funciones"], ["Cómo funciona", "/#como-funciona"], ["Planes", "/#planes"]] },
  { title: "Soluciones", links: [["Ventas e inventario", "/#funciones"], ["Clientes y créditos", "/#como-funciona"], ["Casos de uso", "/#casos-ilustrativos"]] },
  { title: "Recursos", links: [["Preguntas frecuentes", "/#preguntas-frecuentes"], ["Stack utilizado", "/#integraciones"], ["Integraciones", "/#integraciones"]] },
  { title: "Compañía", links: [["Sobre el proyecto", "/#nosotros"], ["Equipo", "/#nosotros"], ["Contacto", "/#contacto"]] },
] as const;

function SocialIcon({ network }: { network: Network }) {
  return <Localized><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
    {network === "X" && <path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.4L5.6 22H2.4l8.2-9.4L.8 2h6.4l4.4 6.6L18.9 2ZM17.7 20h1.7L6.1 4H4.3l13.4 16Z" />}
    {network === "LinkedIn" && <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5V9h3ZM6.5 7.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4ZM19 19h-3v-5.2c0-1.3-.5-2-1.5-2-1.1 0-1.7.8-1.7 2V19H10V9h2.8v1.4c.6-1 1.6-1.7 3-1.7 2.3 0 3.2 1.4 3.2 4Z" />}
    {network === "Discord" && <path d="M19.7 4.9a18 18 0 0 0-4.4-1.4l-.5 1a16 16 0 0 0-5.6 0l-.5-1a18 18 0 0 0-4.4 1.4C1.5 9 .7 13 .9 17a18 18 0 0 0 5.4 2.7l1.1-1.8-1.7-.8.4-.3c3.8 1.8 8 1.8 11.8 0l.4.3-1.7.8 1.1 1.8a18 18 0 0 0 5.4-2.7c.3-4.7-.8-8.7-3.4-12.1ZM8.5 14.8c-1 0-1.8-1-1.8-2.1s.8-2.1 1.8-2.1 1.8 1 1.8 2.1-.8 2.1-1.8 2.1Zm7 0c-1 0-1.8-1-1.8-2.1s.8-2.1 1.8-2.1 1.8 1 1.8 2.1-.8 2.1-1.8 2.1Z" />}
    {network === "YouTube" && <path d="M22.5 6.2a2.8 2.8 0 0 0-2-2C18.8 3.7 12 3.7 12 3.7s-6.8 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 5.8 2.8 2.8 0 0 0 2 2c1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-5.8ZM9.8 15.6V8.4L16 12l-6.2 3.6Z" />}
    {network === "Facebook" && <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.7-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0 0 22 12Z" />}
    {network === "Instagram" && <g fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></g>}
  </svg></Localized>;
}

export function Footer() {
  return (
    <Localized><footer id="footer" className={styles.footer} aria-label="Pie de página de MiBazarPE">
      <div className={styles.inner}>
        <div className={styles.socialStrip} aria-label="Canales de MiBazarPE">
          {networks.map(network => companySocialUrls[network]
            ? <a key={network} className={styles.socialItem} href={companySocialUrls[network]} target="_blank" rel="noopener noreferrer" aria-label={`MiBazarPE en ${network} (abre en una nueva pestaña)`}><SocialIcon network={network} /><span>{network}</span><ArrowUpRight size={14} aria-hidden="true" /></a>
            : <span key={network} className={styles.socialItem} aria-disabled="true" title={`${network}: cuenta oficial pendiente de activación`}><SocialIcon network={network} /><span>{network}</span><small>Próximamente</small></span>)}
        </div>
        <p className={styles.socialNote}>¿Necesitas ayuda? <a href={marketingContact.whatsapp} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp ↗</a> o <a href={`mailto:${marketingContact.email}`}>correo electrónico</a>.</p>
        <div className={styles.main}>
          <div className={styles.identity}>
            <Link href="/#inicio" className={styles.brand} aria-label="MiBazarPE — Inicio"><Image src="/brand/mibazarpe-logo.png" alt="MiBazarPE" width={2172} height={724} unoptimized className={styles.logo} /></Link>
            <p className={styles.description}>MiBazarPE te ayuda a organizar ventas, inventario, clientes y créditos desde un solo lugar.</p>
            <Newsletter />
          </div>
          <nav className={styles.columns} aria-label="Navegación del pie de página">
            {groups.map(group => <div key={group.title}><h2>{group.title}</h2><ul>{group.links.map(([label, href]) => <li key={label}><Link href={href}>{label}</Link></li>)}</ul></div>)}
          </nav>
        </div>
        <ElectricWordmark />
        <div className={styles.utilityRow}>
          <ThemeControls />
        </div>
        <div className={styles.bottom}>
          <div className={styles.legal} aria-label="Información legal">
            {legalLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          </div>
          <p>© 2026 MiBazarPE. Todos los derechos reservados.</p>
          <small><a href="https://skiper-ui.com" target="_blank" rel="noopener noreferrer">Efectos inspirados en Skiper UI</a></small>
        </div>
      </div>
    </footer></Localized>
  );
}
