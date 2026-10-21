"use client";
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { translateLanding } from "./landing-translations";

export type LandingLanguage = "es" | "en";
export type LandingRegion = "PE" | "ES" | "MX" | "AR" | "CO" | "CL" | "US" | "GB" | "CA" | "AU";
export type LandingTheme = "system" | "light" | "dark";
const eventName = "mibazarpe:landing-preferences";
const themeKey = "mibazarpe-landing-theme";
const languageKey = "mibazarpe-landing-language";
const regionKey = "mibazarpe-landing-region";
function read(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function save(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* Preferences still work for this visit. */ } }
function subscribe(notify: () => void) {
  window.addEventListener(eventName, notify); window.addEventListener("storage", notify);
  return () => { window.removeEventListener(eventName, notify); window.removeEventListener("storage", notify); };
}
let visitLanguage: LandingLanguage | undefined;
let visitTheme: LandingTheme | undefined;
let visitRegion: LandingRegion | undefined;
const regionSnapshot = (): LandingRegion => {
  const value=visitRegion??read(regionKey);
  return (["PE","ES","MX","AR","CO","CL","US","GB","CA","AU"] as const).find(region=>region===value)??(languageSnapshot()==="en"?"US":"PE");
};
const languageSnapshot = (): LandingLanguage => visitLanguage ?? (read(languageKey) === "en" ? "en" : "es");
const themeSnapshot = (): LandingTheme => {
  const value = visitTheme ?? read(themeKey);
  return value === "light" || value === "system" ? value : "dark";
};
type Preferences = { language: LandingLanguage; region:LandingRegion; theme: LandingTheme; t: (text:string)=>string; setLanguage:(value:LandingLanguage,region?:LandingRegion)=>void; setTheme:(value:LandingTheme)=>void };
const Context = createContext<Preferences>({ language: "es", region:"PE", theme: "dark",
  t: (text: string) => text, setLanguage: () => {}, setTheme: () => {} });

/** Public landing preferences only. No authentication or business settings are changed. */
export function LandingPreferences({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, languageSnapshot, () => "es" as const);
  const theme = useSyncExternalStore(subscribe, themeSnapshot, () => "dark" as const);
  const region = useSyncExternalStore(subscribe, regionSnapshot, () => "PE" as const);
  useEffect(() => {
    const html = document.documentElement;
    const originalLanguage = html.lang;
    const originalDark = html.classList.contains("dark");
    return () => { html.lang = originalLanguage; html.classList.toggle("dark", originalDark); };
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => {
    const preference = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && preference.matches));
    apply(); preference.addEventListener("change", apply);
    return () => preference.removeEventListener("change", apply);
  }, [theme]);

  function setLanguage(value: LandingLanguage,selectedRegion:LandingRegion=value==="en"?"US":"PE") {
    visitLanguage = value; visitRegion=selectedRegion; save(languageKey, value); save(regionKey,selectedRegion); window.dispatchEvent(new Event(eventName));
  }
  function setTheme(value: LandingTheme) {
    const apply = () => {
      visitTheme = value; save(themeKey, value);
      document.documentElement.classList.toggle("dark", value === "dark" || (value === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
      flushSync(() => window.dispatchEvent(new Event(eventName)));
    };
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) { apply(); return; }
    if (document.documentElement.hasAttribute("data-landing-transition")) return;
    document.documentElement.dataset.landingTransition = "theme";
    const transition = document.startViewTransition(apply);
    void transition.finished.catch(() => {}).finally(() => { delete document.documentElement.dataset.landingTransition; });
  }
  return <Context.Provider value={{ language, region, theme, setLanguage, setTheme, t: text => translateLanding(text, language) }}>{children}</Context.Provider>;
}
export const useLandingPreferences = () => useContext(Context);
