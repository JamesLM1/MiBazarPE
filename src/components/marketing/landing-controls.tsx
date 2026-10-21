"use client";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { Check, ChevronDown, Monitor, Search, X } from "lucide-react";
import { useLandingPreferences, type LandingTheme, type LandingRegion } from "./landing-preferences";
import styles from "./landing-controls.module.css";

const languages = [
  { value: "es", name: "Español", other: "Spanish", region: "Perú", code: "PE" },
  { value: "es", name: "Español", other: "Spanish", region: "España", code: "ES" },
  { value: "es", name: "Español", other: "Spanish", region: "México", code: "MX" },
  { value: "es", name: "Español", other: "Spanish", region: "Argentina", code: "AR" },
  { value: "es", name: "Español", other: "Spanish", region: "Colombia", code: "CO" },
  { value: "es", name: "Español", other: "Spanish", region: "Chile", code: "CL" },
  { value: "en", name: "English", other: "Inglés", region: "Estados Unidos", code: "US" },
  { value: "en", name: "English", other: "Inglés", region: "Reino Unido", code: "GB" },
  { value: "en", name: "English", other: "Inglés", region: "Canadá", code: "CA" },
  { value: "en", name: "English", other: "Inglés", region: "Australia", code: "AU" },
] as const;

function Flag({country}:{country:LandingRegion}) {
  return <svg viewBox="0 0 30 30" className={styles.flag} aria-hidden="true">
    <rect width="30" height="30" fill="#fff"/>
    {country==="PE"&&<path d="M0 0h10v30H0ZM20 0h10v30H20Z" fill="#d91023"/>}
    {country==="ES"&&<><rect width="30" height="30" fill="#f3c928"/><path d="M0 0h30v8H0ZM0 22h30v8H0Z" fill="#b91f31"/></>}
    {country==="MX"&&<><rect width="10" height="30" fill="#126d4d"/><rect x="20" width="10" height="30" fill="#c9333f"/><circle cx="15" cy="15" r="2" fill="#947444"/></>}
    {country==="AR"&&<><path d="M0 0h30v10H0ZM0 20h30v10H0Z" fill="#75bce9"/><circle cx="15" cy="15" r="2.5" fill="#e8bc32"/></>}
    {country==="CO"&&<><rect width="30" height="15" fill="#f5cf32"/><rect y="15" width="30" height="7.5" fill="#204ea2"/><rect y="22.5" width="30" height="7.5" fill="#c92b3e"/></>}
    {country==="CL"&&<><rect y="15" width="30" height="15" fill="#cf3042"/><rect width="15" height="15" fill="#245999"/><path d="m7.5 3 1.2 3.2h3.4L9.4 8.3l1 3.2-2.9-2-2.8 2 1-3.2-2.8-2.1h3.4Z" fill="#fff"/></>}
    {country==="US"&&<>{[0,1,2,3,4,5,6].map(i=><rect key={i} y={i*4.6} width="30" height="2.3" fill="#c63a46"/>)}<rect width="15" height="16" fill="#284b8a"/>{[0,1,2,3].map(row=>[0,1,2].map(col=><circle key={`${row}-${col}`} cx={3+col*4.6} cy={2.5+row*3.6} r=".75" fill="#fff"/>))}</>}
    {country==="GB"&&<><rect width="30" height="30" fill="#244579"/><path d="M0 0 30 30M30 0 0 30" stroke="#fff" strokeWidth="6"/><path d="M0 0 30 30M30 0 0 30" stroke="#c73c49" strokeWidth="2"/><path d="M15 0v30M0 15h30" stroke="#fff" strokeWidth="9"/><path d="M15 0v30M0 15h30" stroke="#c73c49" strokeWidth="5"/></>}
    {country==="CA"&&<><path d="M0 0h8v30H0ZM22 0h8v30h-8Z" fill="#cc293c"/><path d="m15 7 2 5 3-1-1 4 3 2-6 3v4h-2v-4l-6-3 3-2-1-4 3 1Z" fill="#cc293c"/></>}
    {country==="AU"&&<><rect width="30" height="30" fill="#244579"/><path d="M0 0 14 14M14 0 0 14" stroke="#fff" strokeWidth="3"/><path d="M7 0v14M0 7h14" stroke="#fff" strokeWidth="5"/><path d="M7 0v14M0 7h14" stroke="#c73c49" strokeWidth="2"/>{[[22,8],[24,20],[17,25],[9,23]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="#fff"/>)}</>}
  </svg>;
}

export function LanguagePicker() {
  const { region, setLanguage, t } = useLandingPreferences();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = languages.find(item => item.code === region)!;
  const matches = languages.filter(item => `${item.name} ${item.other} ${item.region} ${t(item.region)} ${item.code}`.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(search.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")));
  return <Dialog.Root open={open} onOpenChange={value => { setOpen(value); if (!value) setSearch(""); }}>
    <Dialog.Trigger asChild><button type="button" className={styles.languageTrigger} aria-label={t("Cambiar idioma")} title={t("Cambiar idioma")}><Flag country={selected.code}/><ChevronDown size={14} aria-hidden="true" /></button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.overlay} />
      <Dialog.Content className={styles.dialog}>
        <Dialog.Title className={styles.dialogTitle}>{t("Elige idioma o región")}</Dialog.Title>
        <Dialog.Description className={styles.dialogDescription}>{t("Cambia el idioma de la landing de MiBazarPE.")}</Dialog.Description>
        <Dialog.Close asChild><button type="button" className={styles.close} aria-label={t("Cerrar selector de idioma")}><X size={18} /></button></Dialog.Close>
        <label className={styles.search}><Search size={18} aria-hidden="true" /><input value={search} onChange={event => setSearch(event.target.value)} aria-label={t("Buscar país o idioma")} placeholder={t("Buscar país o idioma")} /></label>
        <div className={styles.languages} role="group" aria-label={t("Idiomas disponibles")}>
          {matches.map(item => <button key={item.code} type="button" className={styles.languageRow} aria-pressed={region === item.code} onClick={() => { setLanguage(item.value,item.code); setOpen(false); setSearch(""); }}>
            <Flag country={item.code}/><span><strong>{t(item.region)}</strong><small>{item.name}</small></span>{region === item.code && <Check size={17} aria-hidden="true" />}
          </button>)}
          {!matches.length && <p className={styles.empty}>{t("No se encontraron idiomas.")}</p>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function ThemeGlyph({ kind, active }: { kind: LandingTheme | "toggle"; active: boolean }) {
  if (kind === "system") return <Monitor size={21} strokeWidth={1.6} aria-hidden="true" />;
  return <svg viewBox="0 0 32 32" width="26" height="26" className={styles.glyph} data-active={active} data-kind={kind} aria-hidden="true">
    {kind === "toggle" ? <><circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M16 5a11 11 0 0 1 0 22Z" fill="currentColor" /></> : kind === "dark" ? <path d="M25.5 19.5A10.7 10.7 0 0 1 12.5 6.4a10.8 10.8 0 1 0 13 13.1Z" fill="currentColor" /> : <><circle className={styles.sunCore} cx="16" cy="16" r="5.5" fill="currentColor" /><g className={styles.rays} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">{[0,45,90,135,180,225,270,315].map(angle => <path key={angle} d="M16 3v3" transform={`rotate(${angle} 16 16)`} />)}</g></>}
  </svg>;
}
export function ThemeQuickToggle() {
  const { theme, setTheme, t } = useLandingPreferences();
  return <button type="button" className={styles.themeToggle} aria-label={t("Cambiar entre claro y oscuro")} title={t("Cambiar entre claro y oscuro")} onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}><ThemeGlyph kind="toggle" active={theme === "dark"} /></button>;
}
export function ThemeControls() {
  const { theme, setTheme, t } = useLandingPreferences();
  return <div className={styles.themeControls} role="group" aria-label={t("Tema de la landing")}><span>{t("Tema:")}</span>
    {([ ["system", "Sistema"], ["light", "Claro"], ["dark", "Oscuro"] ] as const).map(([value, label]) => <button key={value} type="button" className={styles.themeOption} aria-label={t(`Tema ${label.toLowerCase()}`)} title={t(label)} aria-pressed={theme === value} onClick={() => setTheme(value)}><ThemeGlyph kind={value} active={theme === value} /></button>)}
  </div>;
}
