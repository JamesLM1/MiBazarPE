"use client";

import { useRef, useState } from "react";
import { useInView } from "motion/react";
import { Pause, Play } from "lucide-react";
import styles from "./testimonials.module.css";

const scenarios = [
  { profile: "Dueño de bazar", initials: "DB", text: "Quiero revisar ventas, inventario y caja sin tener que organizar la información en varios lugares." },
  { profile: "Negocio familiar", initials: "NF", text: "Necesitamos llevar un mejor control de los créditos y saber qué pagos siguen pendientes." },
  { profile: "Encargado de ventas", initials: "EV", text: "Busco registrar las operaciones del día de manera sencilla y consultar después el movimiento del negocio." },
];

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.1 });
  const [paused, setPaused] = useState(false);
  return (
    <section id="casos-ilustrativos" className={styles.section} aria-labelledby="scenarios-title">
      <header className={styles.intro}>
        <span className={styles.badge}>Necesidades del día a día</span>
        <h2 id="scenarios-title">Lo que buscamos facilitar</h2>
        <p>Tres situaciones que orientan la propuesta de MiBazarPE.<br />Son casos ilustrativos, no testimonios de clientes.</p>
      </header>
      <ul className="sr-only" aria-label="Casos ilustrativos de MiBazarPE">{scenarios.map(scenario => <li key={scenario.profile}><h3>{scenario.profile}</h3><p>Caso ilustrativo</p><p>{scenario.text}</p></li>)}</ul>
      <div ref={ref} className={styles.viewport} data-paused={paused || !visible} aria-hidden="true">
        {[0, 1, 2].map(column => <div key={column} className={styles.column}>
          <div className={styles.track}>
            {[0, 1].map(copy => <div className={styles.group} key={copy}>
              {[0, 1, 2].map(index => { const scenario = scenarios[(index + column) % scenarios.length]; return <figure className={styles.card} key={scenario.profile}>
                <span className={styles.caseLabel}>Caso ilustrativo</span>
                <blockquote>{scenario.text}</blockquote>
                <figcaption><span className={styles.avatar}>{scenario.initials}</span><span><strong>{scenario.profile}</strong><small>Contexto de uso previsto</small></span></figcaption>
              </figure>; })}
            </div>)}
          </div>
        </div>)}
      </div>
      <div className={styles.controls}><button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? "Reanudar movimiento de los casos ilustrativos" : "Pausar movimiento de los casos ilustrativos"}>{paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}{paused ? "Reanudar movimiento" : "Pausar movimiento"}</button></div>
    </section>
  );
}
