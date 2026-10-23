"use client";
import { Localized } from "./localized";


import Image from "next/image";
import { createElement, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import Script from "next/script";
import { HERO_LAPTOP_SCENE } from "./hero-laptop-config";
import styles from "./hero-laptop.module.css";

function subscribeMotion(notify: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function subscribePointer(notify: () => void) {
  const media = window.matchMedia("(hover: hover) and (pointer: fine)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

/** Original mckp.live player; the scene contains only our fictional-data tour. */
export function HeroLaptop({ active = true, compact = false }: { active?: boolean; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const finePointer = useSyncExternalStore(subscribePointer,
    () => window.matchMedia("(hover: hover) and (pointer: fine)").matches, () => false);

  return (
    <Localized><figure className={styles.figure} aria-label="Laptop con un recorrido automático por MiBazarPE">
      {finePointer && !reduced && <Script src="https://embed.mckp.live/embed.js" strategy="afterInteractive" onError={() => setFailed(true)} />}
      <div className={styles.scene}>
        {active && finePointer && !reduced && !failed && createElement("mockup-player", {
          key: `${HERO_LAPTOP_SCENE.id}-${reduced}-${finePointer}`,
          "mockup-id": HERO_LAPTOP_SCENE.id,
          width: "100%", height: "100%", theme: "dark", loader: "true",
          trigger: reduced ? "click" : "inview",
          "trigger-threshold": "0",
          "trigger-target": "scene",
          role: reduced ? "button" : undefined, tabIndex: reduced ? 0 : undefined,
          onKeyDown: reduced ? (event: KeyboardEvent<HTMLElement>) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); }
          } : undefined,
          "trigger-loop": "false",
          "trigger-restart": "true",
          "cursor-enabled": String(!reduced && finePointer),
          "cursor-affect-page": "true",
          "click-enabled": String(!reduced),
          "shake-enabled": String(!reduced),
          "shake-intensity": "14",
          "shake-z": "0", "shake-angle": "0", "shake-duration": "300",
          "zoom-enabled": "false",
          "camera-zoom": compact ? "32" : "48", "background-transparent": "true", progressive: "true",
          "aria-label": reduced ? "Haz clic para ver la apertura de la laptop y el recorrido de MiBazarPE" : "Escena 3D de MiBazarPE: apertura, respuesta al cursor y al clic",
        })}
        {(failed || !finePointer || reduced) && <div className={styles.fallback}>
          <Image src="/demo/portada.jpg" loading="eager" alt="Vista del dashboard de MiBazarPE. Usa Ver demostración para reproducir el recorrido." fill sizes="(max-width: 1023px) 90vw, 60vw" />
        </div>}
      </div>
      <figcaption className="sr-only">Recorrido grabado por MiBazarPE con datos ficticios y sin sonido. Puedes ampliarlo con Ver demostración.</figcaption>
    </figure></Localized>
  );
}
