"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Dialog } from "radix-ui";
import { MotionConfig } from "motion/react";
import { Check, Contrast, Moon, Palette, Sun, X } from "lucide-react";
import styles from "./workspace-appearance.module.css";

type Appearance = { mode: "light" | "dark" | "system"; wallpaper: "smoke" | "stone" | "ember" | "aurora"; accent: "orange" | "blue" | "gold"; solid: boolean; reduceMotion: boolean };
const initial: Appearance = { mode: "light", wallpaper: "smoke", accent: "orange", solid: false, reduceMotion: false };
const storageKey = "mibazarpe.workspace.appearance.v1";
let visitAppearance: Appearance | undefined;
const AppearanceContext = createContext<{ value: Appearance; change: (patch: Partial<Appearance>) => void } | null>(null);

function savedAppearance(): Appearance {
  try {
    const item = JSON.parse(localStorage.getItem(storageKey) ?? "null") as Partial<Appearance> | null;
    if (!item) return initial;
    return { mode: ["light", "dark", "system"].includes(item.mode ?? "") ? item.mode! : initial.mode,
      wallpaper: ["smoke", "stone", "ember", "aurora"].includes(item.wallpaper ?? "") ? item.wallpaper! : initial.wallpaper,
      accent: ["orange", "blue", "gold"].includes(item.accent ?? "") ? item.accent! : initial.accent,
      solid: item.solid === true, reduceMotion: item.reduceMotion === true };
  } catch { return initial; }
}

export function WorkspaceAppearance({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Appearance>(() => visitAppearance ?? initial);
  const desiredAppearance = useRef(value);
  const [ready, setReady] = useState(false);
  const transition = useRef<ViewTransition | null>(null);
  function change(patch: Partial<Appearance>) {
    desiredAppearance.current = { ...desiredAppearance.current, ...patch };
    const apply = () => { visitAppearance = desiredAppearance.current; flushSync(() => setValue(desiredAppearance.current)); };
    if (!document.startViewTransition || value.reduceMotion || patch.reduceMotion || matchMedia("(prefers-reduced-motion: reduce)").matches) { apply(); return; }
    transition.current?.skipTransition();
    document.documentElement.dataset.workspaceTransition = "appearance";
    const next = document.startViewTransition(apply);
    transition.current = next;
    void next.finished.catch(() => {}).finally(() => { if (transition.current === next) { transition.current = null; delete document.documentElement.dataset.workspaceTransition; } });
  }
  useEffect(() => {
    // Load only visual preferences. No business data or user identifiers are stored.
    const restored = visitAppearance ?? savedAppearance();
    visitAppearance = restored;
    desiredAppearance.current = restored;
    const frame = requestAnimationFrame(() => { setValue(restored); setReady(true); });
    function syncAppearance(event: StorageEvent) {
      if (event.key !== storageKey) return;
      const preference = savedAppearance();
      visitAppearance = preference; desiredAppearance.current = preference;
      setValue(preference);
    }
    window.addEventListener("storage", syncAppearance);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", syncAppearance); };
  }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function apply() {
      root.classList.add(styles.themeHost);
      root.dataset.workspaceMode = value.mode === "system" ? media.matches ? "dark" : "light" : value.mode;
      root.dataset.workspaceWallpaper = value.wallpaper;
      root.dataset.workspaceAccent = value.accent;
      root.dataset.workspaceSolid = String(value.solid);
      root.dataset.workspaceMotion = value.reduceMotion ? "reduced" : "system";
    }
    apply(); media.addEventListener("change", apply);
    if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* A blocked store must not prevent appearance changes. */ } }
    return () => {
      media.removeEventListener("change", apply);
      root.classList.remove(styles.themeHost);
      for (const name of ["workspaceMode", "workspaceWallpaper", "workspaceAccent", "workspaceSolid", "workspaceMotion"]) delete root.dataset[name];
    };
  }, [value, ready]);
  return <AppearanceContext.Provider value={{ value, change }}><MotionConfig reducedMotion={value.reduceMotion ? "always" : "user"}>{children}</MotionConfig></AppearanceContext.Provider>;
}

export function useWorkspaceMotion() {
  const context = useContext(AppearanceContext);
  return context?.value.reduceMotion ?? false;
}

export function WorkspaceWallpaper() {
  return <div className={styles.wallpaper} aria-hidden="true"><svg viewBox="0 0 1800 1200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="workspace-ribbon" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--ws-ribbon-a)" /><stop offset="1" stopColor="var(--ws-ribbon-b)" /></linearGradient><radialGradient id="workspace-orb"><stop stopColor="var(--ws-orb)" stopOpacity=".7" /><stop offset="1" stopColor="var(--ws-orb)" stopOpacity="0" /></radialGradient></defs><ellipse cx="230" cy="110" rx="700" ry="570" fill="url(#workspace-orb)" /><path d="M-300 950C200 250 730 1060 1200 590S1660 80 2110 470L2000 920C1450 560 1210 1280 580 1090S-50 960-300 1310Z" fill="url(#workspace-ribbon)" /><path d="M-100 1000C410 390 680 1010 1220 690S1700 260 1940 410M-100 1025C410 415 680 1035 1220 715S1700 285 1940 435" fill="none" stroke="var(--ws-ribbon-edge)" strokeWidth="1.5" /><ellipse cx="1520" cy="220" rx="190" ry="110" fill="url(#workspace-orb)" transform="rotate(-28 1520 220)" /></svg></div>;
}

export function AppearanceDialog() {
  const context = useContext(AppearanceContext);
  if (!context) return null;
  const { value, change } = context;
  return <Dialog.Root><Dialog.Trigger asChild><button type="button" className={styles.trigger} aria-label="Personalizar apariencia" title="Personalizar apariencia"><Palette size={18} aria-hidden="true" /></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.dialog}>
    <header><div><p>TU ESPACIO, A TU MANERA</p><Dialog.Title>Apariencia</Dialog.Title><Dialog.Description>Elige la luz, el fondo y el acento de tu área de trabajo.</Dialog.Description></div><Dialog.Close className={styles.close} aria-label="Cerrar apariencia"><X size={20} /></Dialog.Close></header>
    <div className={styles.body}>
      <section><div className={styles.rowHeading}><Contrast size={19} /><div><h3>Tonalidad</h3><p>Claro, oscuro o según tu dispositivo</p></div></div><div className={styles.segmented} role="group" aria-label="Tonalidad del dashboard">{([{ key: "light", label: "Claro", icon: Sun }, { key: "dark", label: "Oscuro", icon: Moon }, { key: "system", label: "Automático", icon: Contrast }] as const).map(item => <button key={item.key} aria-pressed={value.mode === item.key} onClick={() => change({ mode: item.key })}><item.icon size={15} />{item.label}</button>)}</div></section>
      <section><div className={styles.rowHeading}><Palette size={19} /><div><h3>Fondo difuminado</h3><p>Materiales neutros y luz suave detrás del cristal</p></div></div><div className={styles.wallpapers}>{([{ key: "smoke", label: "Humo", description: "Blanco y negro" }, { key: "stone", label: "Piedra", description: "Gris cálido" }, { key: "ember", label: "Brasa", description: "Naranja y carbón" }, { key: "aurora", label: "Azul", description: "La luz de MiBazarPE" }] as const).map(item => <button key={item.key} data-wallpaper={item.key} aria-label={`Fondo ${item.label}`} aria-pressed={value.wallpaper === item.key} onClick={() => change({ wallpaper: item.key })}><span className={styles.preview}><i /><i /><i />{value.wallpaper === item.key && <b><Check size={13} /></b>}</span><strong>{item.label}</strong><small>{item.description}</small></button>)}</div></section>
      <section><div className={styles.rowHeading}><span className={styles.accentMark} /><div><h3>Color de acento</h3><p>Botones, selecciones y gráficos principales</p></div></div><div className={styles.accents} role="group" aria-label="Color de acento">{([{ key: "orange", label: "Naranja", color: "#F4653B" }, { key: "blue", label: "Azul MiBazarPE", color: "#006EFF" }, { key: "gold", label: "Ámbar", color: "#F0B10A" }] as const).map(item => <button key={item.key} aria-label={item.label} aria-pressed={value.accent === item.key} onClick={() => change({ accent: item.key })}><i style={{ background: item.color }}>{value.accent === item.key && <Check size={16} />}</i><span>{item.label}</span></button>)}</div></section>
      <section className={styles.preference}><div><h3>Reducir transparencia</h3><p>Superficies sólidas para facilitar la lectura</p></div><button type="button" role="switch" aria-label="Reducir transparencia" aria-checked={value.solid} onClick={() => change({ solid: !value.solid })}><i /></button></section>
      <section className={styles.preference}><div><h3>Movimiento reducido</h3><p>Transiciones suaves sin desplazamientos ni conteo animado</p></div><button type="button" role="switch" aria-label="Movimiento reducido" aria-checked={value.reduceMotion} onClick={() => change({ reduceMotion: !value.reduceMotion })}><i /></button></section>
      <p className={styles.note}>Tus preferencias se guardan en este navegador y se aplican solo al área privada.</p>
    </div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
