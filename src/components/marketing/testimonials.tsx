"use client";

import { useRef, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { landingEase, landingEntrance } from "./landing-motion";
import { scenarios } from "./testimonials-data";
import styles from "./testimonials.module.css";

function subscribeColumns(onChange: () => void) {
  const queries = [window.matchMedia("(min-width: 1024px)"), window.matchMedia("(min-width: 640px)")];
  queries.forEach(query => query.addEventListener("change", onChange));
  return () => queries.forEach(query => query.removeEventListener("change", onChange));
}
function getColumns() { return window.matchMedia("(min-width: 1024px)").matches ? 3 : window.matchMedia("(min-width: 640px)").matches ? 2 : 1; }

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.1 });
  const reduced = useReducedMotion();
  const columnCount = useSyncExternalStore(subscribeColumns, getColumns, () => 3);
  return <section id="casos-ilustrativos" className={styles.section} aria-labelledby="scenarios-title">
    <motion.header className={styles.intro} initial={reduced ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={landingEntrance} transition={{ duration: reduced ? 0 : 0.6, ease: landingEase }}>
      <h2 id="scenarios-title">Lo que buscamos facilitar</h2>
      <p>Escenarios de uso simulados a partir de necesidades habituales de pequeños comercios. Personas y retratos ficticios.</p>
    </motion.header>
    <div ref={ref} className={styles.viewport} data-offscreen={!visible} style={{ "--columns": columnCount } as CSSProperties}>
      {Array.from({ length: columnCount }, (_, column) => {
        const items = scenarios.filter((_, index) => index % columnCount === column);
        const seconds = items.length * (columnCount === 1 ? 13 : columnCount === 2 ? 10 : 8) * [1, 1.15, 1.075][column];
        return <div key={`${columnCount}-${column}`} className={styles.column} tabIndex={reduced ? undefined : 0} role="group" aria-label={`Escenarios simulados, columna ${column + 1}. El movimiento se detiene mientras esta columna tiene el foco.`}>
          <div className={styles.track} style={{ animationDuration: `${seconds}s`, animationDirection: column % 2 ? "reverse" : "normal" }}>
            {[0, 1].map(copy => <div className={styles.group} key={copy} aria-hidden={copy === 1 ? true : undefined} inert={copy === 1 ? true : undefined}>
              {items.map(scenario => <figure className={styles.card} key={scenario.name}>
                <blockquote>{scenario.text}</blockquote>
                <figcaption><Image className={styles.avatar} src={scenario.avatar} alt="" width={40} height={40} sizes="40px" unoptimized /><span><strong>{scenario.name}</strong><small>{scenario.profile}</small></span></figcaption>
              </figure>)}
            </div>)}
          </div>
        </div>;
      })}
    </div>
  </section>;
}
