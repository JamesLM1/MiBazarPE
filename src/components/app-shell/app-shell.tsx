"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Dialog, DropdownMenu, Popover, Tooltip } from "radix-ui";
import { ArrowUpRight, Bell, ChevronDown, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings, Sparkles, Store, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "@/features/auth/service";
import { displayRole } from "@/features/dashboard/model";
import { selectBusiness } from "@/features/dashboard/actions";
import type { PrivateContext } from "@/features/dashboard/types";
import { navigationForRole } from "./navigation";
import { WorkspaceClock } from "./workspace-clock";
import styles from "./app-shell.module.css";
import { motion } from "motion/react";
import { WorkspaceAppearance, WorkspaceWallpaper, AppearanceDialog } from "./workspace-appearance";

// Shared private shell; business navigation and authorization stay role-driven.
function ShellContent({ context, children }: { context: PrivateContext; children: ReactNode }) {
  const pathname = usePathname();
  const privateNavigation=navigationForRole(context.user.role,Boolean(context.business));
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const current = privateNavigation.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const results = privateNavigation.filter(item => `${item.label} ${item.href === "/inventario" ? "productos" : ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").includes(normalizedQuery));
  const initials = context.user.name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true); setLogoutError("");
    try { await signOut(); router.replace("/login"); router.refresh(); }
    catch { setLogoutError("No se pudo cerrar la sesión. Vuelve a intentarlo."); setLoggingOut(false); }
  }

  function userMenu(sidebar = false) {
    return <DropdownMenu.Root><DropdownMenu.Trigger asChild><button className={sidebar ? styles.sidebarFoot : styles.userButton} aria-label={sidebar ? "Menú de usuario del sidebar" : "Menú de usuario"}>
      <span className={styles.avatar}>{initials}</span><span className={styles.userText}><strong>{context.user.name}</strong><small>{displayRole(context.user.role === 'SUPERADMIN' ? context.user.role : context.business?.role ?? context.user.role)}</small></span><ChevronDown size={14} />
    </button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" side={sidebar ? "top" : "bottom"} sideOffset={10} className={styles.dropdown}>
      <DropdownMenu.Label>{context.user.name}<small>{context.user.email}</small></DropdownMenu.Label><DropdownMenu.Separator />
      <DropdownMenu.Item asChild><Link href="/perfil" onClick={() => setMobileOpen(false)}><UserRound size={16} />Mi perfil</Link></DropdownMenu.Item>
      {context.user.role!=='CLIENTE'&&<DropdownMenu.Item asChild><Link href="/mi-negocio" onClick={() => setMobileOpen(false)}><Store size={16} />Mi negocio</Link></DropdownMenu.Item>}
      <DropdownMenu.Item asChild><Link href="/configuracion" onClick={() => setMobileOpen(false)}><Settings size={16} />Configuración</Link></DropdownMenu.Item>
      <DropdownMenu.Separator /><DropdownMenu.Item disabled={loggingOut} onSelect={() => void logout()}><LogOut size={16} />{loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}</DropdownMenu.Item>
    </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;
  }

  function navigation(mobile = false) {
    const sections = [
      { key: "comercio", label: "Ventas y clientes", paths: ["/ventas", "/clientes", "/creditos", "/cuentas-por-cobrar", "/pagos", "/invitaciones"] },
      { key: "catalogo", label: "Inventario y compras", paths: ["/inventario", "/compras", "/cuentas-por-pagar", "/importar"] },
      { key: "finanzas", label: "Finanzas", paths: ["/caja", "/liquidaciones", "/reportes"] },
      { key: "sistema", label: "Configuración y avisos", paths: ["/configuracion", "/notificaciones"] },
    ];
    const nestedPaths = sections.flatMap(section => section.paths);
    function navItem(item: (typeof privateNavigation)[number]) {
      return <Tooltip.Root key={item.href}><Tooltip.Trigger asChild><Link href={item.href} className={styles.navLink} aria-label={item.label} aria-current={current?.href === item.href ? "page" : undefined} onClick={() => setMobileOpen(false)}>{current?.href === item.href && <motion.i className={styles.navActive} layoutId={mobile ? "mobile-current-nav" : "desktop-current-nav"} transition={{ type: "spring", duration: .3, bounce: 0 }} aria-hidden="true" />}<item.icon size={18} strokeWidth={1.7} aria-hidden="true" /><span>{item.label}</span></Link></Tooltip.Trigger>{!mobile && <Tooltip.Portal><Tooltip.Content side="right" sideOffset={10} className={styles.tooltip}>{item.label}<Tooltip.Arrow /></Tooltip.Content></Tooltip.Portal>}</Tooltip.Root>;
    }
    return <>
      <Link href="/dashboard" className={styles.brand} aria-label="MiBazarPE — Dashboard" onClick={() => setMobileOpen(false)}>
        <span className={styles.brandMark}><Image src="/brand/mibazarpe-logo.png" alt="" width={2172} height={724} loading="eager" unoptimized /></span><span className={styles.brandWord}>MiBazar<span>PE</span></span>
        <span className={styles.brandShort} aria-hidden="true">M<span>PE</span></span>
      </Link>
      {context.businesses.length > 1 ? <Popover.Root><Popover.Trigger asChild><button type="button" className={styles.business} aria-label={`Seleccionar negocio. Actual: ${context.business?.name ?? "Sin selección"}`}><Store size={17} aria-hidden="true" /><div><strong>{context.business?.name ?? "Mi negocio"}</strong><span>Espacio de trabajo</span></div><ChevronDown size={15} aria-hidden="true" /></button></Popover.Trigger><Popover.Portal><Popover.Content aria-label="Seleccionar negocio" side={mobile ? "bottom" : "right"} align="start" sideOffset={12} className={`${styles.dropdown} ${styles.businessPopover}`}><form action={selectBusiness} className={styles.businessPicker}><label htmlFor={`${mobile ? "mobile" : "desktop"}-business`}>Cambiar de negocio</label><select id={`${mobile ? "mobile" : "desktop"}-business`} name="business" defaultValue={context.business?.id}>{context.businesses.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button type="submit">Cambiar negocio</button></form><Link href="/mi-negocio" onClick={() => setMobileOpen(false)}>Ver ficha del negocio <ArrowUpRight size={14} aria-hidden="true" /></Link></Popover.Content></Popover.Portal></Popover.Root> : <Link href={context.user.role==='CLIENTE'?'/portal':context.business?'/mi-negocio':'/mi-negocio/nuevo'} className={styles.business} onClick={() => setMobileOpen(false)}><Store size={17} aria-hidden="true" /><div><strong>{context.user.role==='CLIENTE'?'Mi cuenta cliente':context.business?.name ?? "Mi negocio"}</strong><span>{context.user.role==='CLIENTE'?'Compras y cuotas':context.business ? "Espacio de trabajo" : "Crear negocio"}</span></div><ChevronRight size={15} aria-hidden="true" /></Link>}
      <nav aria-label={mobile ? "Navegación privada móvil" : "Navegación principal del sistema"} className={styles.navigation}>
        <p className={styles.groupLabel}>Espacio de trabajo</p>
        {privateNavigation.filter(item => !nestedPaths.includes(item.href) && item.href !== "/bazi").map(navItem)}
        {sections.map(section => {
          const items = section.paths.flatMap(path => privateNavigation.filter(item => item.href === path));
          if (!items.length) return null;
          const active = items.some(item => current?.href === item.href);
          const open = openGroups[section.key] ?? active;
          const Icon = items[0].icon;
          const id = `${mobile ? "mobile" : "desktop"}-nav-${section.key}`;
          return <div className={styles.navigationSection} key={section.key}><button type="button" className={styles.navParent} data-active={active} aria-label={section.label} aria-expanded={open} aria-controls={id} onClick={() => {
            if (!mobile && (collapsed === true || (collapsed === undefined && window.matchMedia("(min-width:768px) and (max-width:1100px)").matches))) { setCollapsed(false); setOpenGroups(previous => ({ ...previous, [section.key]: true })); return; }
            setOpenGroups(previous => ({ ...previous, [section.key]: !open }));
          }}><Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span>{section.label}</span><ChevronDown size={14} aria-hidden="true" /></button><div className={styles.subNavigation} id={id} hidden={!open}>{items.map(navItem)}</div></div>;
        })}
        {privateNavigation.filter(item => item.href === "/bazi").map(navItem)}
      </nav>
      {context.user.role!=="CLIENTE"&&<Link href="/bazi" className={styles.baziCard} onClick={() => setMobileOpen(false)} aria-label="Bazi: tu asistente del negocio. Abrir Bazi">
        <Image src="/brand/bazi/welcome.png" alt="Bazi, asistente de MiBazarPE" width={94} height={94} />
        <div><strong>Bazi</strong><p>Tu asistente del negocio</p><span>Abrir Bazi <ArrowUpRight size={13} /></span></div>
        <Sparkles className={styles.baziCollapsed} size={19} aria-hidden="true" />
      </Link>}
      {userMenu(true)}
    </>;
  }

  return <Tooltip.Provider delayDuration={200}><div className={styles.shell} data-collapsed={collapsed}>
    <WorkspaceWallpaper /><a href="#private-content" className={styles.skip}>Saltar al contenido</a>
    <aside className={styles.sidebar}>{navigation()}</aside>
    <div className={styles.inset}>
      <header className={styles.topbar}>
        <div className={styles.headingTools}>
          <button className={`${styles.iconButton} ${styles.desktopToggle}`} onClick={() => setCollapsed(value => !(value ?? window.matchMedia("(max-width: 1100px)").matches))} aria-label="Alternar sidebar" aria-expanded={collapsed === undefined ? undefined : !collapsed}>{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button>
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild><button className={`${styles.iconButton} ${styles.mobileToggle}`} aria-label="Abrir navegación"><Menu size={20} /></button></Dialog.Trigger>
            <Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.drawer}>
              <Dialog.Title className={styles.srOnly}>Navegación de MiBazarPE</Dialog.Title>
              <Dialog.Description className={styles.srOnly}>Accede a los módulos de tu negocio.</Dialog.Description>
              <Dialog.Close className={styles.drawerClose} aria-label="Cerrar navegación"><X size={20} /></Dialog.Close>
              {navigation(true)}
            </Dialog.Content></Dialog.Portal>
          </Dialog.Root>
          <nav aria-label="Ruta actual" className={styles.breadcrumb}><span aria-current="page">{pathname === "/demostracion" ? "Recorrido de MiBazarPE" : pathname === "/perfil" ? "Mi perfil" : pathname === "/mi-negocio" ? "Mi negocio" : current?.title ?? "Dashboard"}</span></nav>
        </div>
        <div className={styles.workspaceToolbar}><div className={styles.search} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSearchOpen(false); }}>
          <Search size={16} aria-hidden="true" /><Input aria-label="Buscar en MiBazarPE" placeholder="Buscar en MiBazarPE…" value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === "Escape") setSearchOpen(false); }} aria-controls={searchOpen ? "module-search-results" : undefined} />
          {searchOpen && <div className={styles.searchResults} id="module-search-results"><small>IR A UN MÓDULO</small><p>Busca una sección; dentro de cada módulo puedes filtrar sus registros.</p>{results.map(item => <Link key={item.href} href={item.href} onClick={() => { setSearchOpen(false); setQuery(""); }}><item.icon size={16} />{item.label}<ChevronRight size={13} /></Link>)}{!results.length && <p>No se encontraron módulos.</p>}</div>}
        </div>
        <WorkspaceClock /><div className={styles.userTools}><AppearanceDialog />
          {context.user.role!=="CLIENTE"&&<Button asChild variant="secondary" className={styles.baziButton}><Link href="/bazi" aria-label="Abrir Bazi"><Sparkles size={15} /><span>Bazi</span></Link></Button>}
          <DropdownMenu.Root><DropdownMenu.Trigger asChild><button className={styles.iconButton} aria-label="Notificaciones"><Bell size={19} /></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={12} className={styles.dropdown}>
            <DropdownMenu.Label>Notificaciones</DropdownMenu.Label><p className={styles.menuNote}>Consulta los avisos de stock y los próximos vencimientos.</p><DropdownMenu.Item asChild><Link href={context.user.role === "CLIENTE" ? "/portal" : "/notificaciones"}>Ver avisos y vencimientos<ChevronRight size={14} /></Link></DropdownMenu.Item>
          </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
          <span className={styles.divider} />
          {userMenu()}
          {context.business && (context.business.role === "PROPIETARIO" || context.user.role === "SUPERADMIN") && <DropdownMenu.Root><DropdownMenu.Trigger asChild><button type="button" className={styles.newAction} aria-label="Nuevo"><Plus size={15} aria-hidden="true" /><span>Nuevo</span></button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={12} className={styles.dropdown}><DropdownMenu.Label>Crear en tu negocio</DropdownMenu.Label>{privateNavigation.filter(item => ["/ventas", "/compras", "/clientes", "/inventario"].includes(item.href)).map(item => <DropdownMenu.Item asChild key={item.href}><Link href={`${item.href}?nuevo=1`} onClick={() => window.dispatchEvent(new CustomEvent("mibazarpe:compose", { detail: item.href }))}><item.icon size={16} aria-hidden="true" />{item.href === "/ventas" ? "Nueva venta" : item.href === "/compras" ? "Nueva compra" : item.href === "/clientes" ? "Nuevo cliente" : "Nuevo producto"}</Link></DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>}
        </div>
        </div>
      </header>
      {logoutError && <p role="alert" className={styles.notice}>{logoutError}</p>}
      <main key={pathname} id="private-content" className={styles.content}>
        {children}
      </main>
      <footer className={styles.privateFooter}><span>MiBazarPE</span><span>Tu negocio, en una sola vista.</span></footer>
    </div>
  </div></Tooltip.Provider>;
}

export function AppShell(props: { context: PrivateContext; children: ReactNode }) {
  return <WorkspaceAppearance><ShellContent {...props} /></WorkspaceAppearance>;
}
