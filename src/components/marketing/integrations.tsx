"use client";
import { Localized } from "./localized";


import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { landingEase, landingEntrance, usePointerDepth } from "./landing-motion";
import styles from "./integrations.module.css";

const technologies = [
  { name: "Next.js", description: "Framework web", icon: "nextdotjs", duration: 7.6, delay: -1.8 },
  { name: "React", description: "Interfaz de usuario", icon: "react", duration: 9.2, delay: -4.1 },
  { name: "TypeScript", description: "Tipado estático", icon: "typescript", duration: 8.4, delay: -2.6 },
  { name: "Tailwind CSS", description: "Sistema de estilos", icon: "tailwindcss", duration: 10.1, delay: -6.2 },
  { name: "Supabase", description: "Backend y autenticación", icon: "supabase", duration: 8.9, delay: -3.7 },
  { name: "PostgreSQL", description: "Base de datos", icon: "postgresql", duration: 10.8, delay: -7.3 },
  { name: "Netlify", description: "Despliegue", icon: null, duration: 9.7, delay: -5.4 },
  { name: "Brevo", description: "Servicio SMTP", icon: "brevo", duration: 8.1, delay: -0.9 },
] as const;

function TechnologyCard({ technology, index }: { technology: typeof technologies[number]; index: number }) {
  const reduced = useReducedMotion();
  const depth = usePointerDepth();

  return (
    <Localized><motion.li
      className={styles.slot}
      variants={landingEntrance}
      transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : index * 0.065, ease: landingEase }}
      style={{ "--float-duration": `${technology.duration}s`, "--float-delay": `${technology.delay}s` } as CSSProperties}
    >
      {/* Separate layers keep entrance, floating and pointer depth from competing. */}
      <div className={styles.float}>
        <motion.div className={styles.card} style={{ transform: depth.transform }} {...depth.handlers}>
          <span className={styles.cardGlow} aria-hidden="true" />
          <span className={styles.icon} aria-hidden="true">
            {technology.icon ? (
              <Image src={`/technologies/${technology.icon}.svg`} alt="" width={28} height={28} />
            ) : (
              <span style={{fontWeight:700,fontSize:24}} aria-hidden="true">N</span>
            )}
          </span>
          <span className={styles.details}>
            <span className={styles.name}>{technology.name}</span>
            <span className={styles.descriptor}>{technology.description}</span>
          </span>
        </motion.div>
      </div>
    </motion.li></Localized>
  );
}

export function Integrations() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.1 });
  const reduced = useReducedMotion();

  return (
    <Localized><section ref={sectionRef} id="integraciones" className={styles.section} aria-labelledby="integrations-title" data-running={inView && !reduced}>
      <div className={styles.scene}>
        <div className={styles.atmosphere} aria-hidden="true" />
        <motion.header className={styles.intro} initial={reduced ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={landingEntrance} transition={{ duration: reduced ? 0 : 0.65, ease: landingEase }}>
          <p className={styles.eyebrow}>STACK TECNOLÓGICO</p>
          <h2 id="integrations-title">La tecnología detrás de MiBazarPE</h2>
          <p className={styles.description}>Herramientas modernas que utilizamos para construir la experiencia de MiBazarPE.</p>
        </motion.header>
        <motion.ul className={styles.constellation} aria-label="Tecnologías de MiBazarPE" initial={reduced ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
          {technologies.map((technology, index) => <TechnologyCard key={technology.name} technology={technology} index={index} />)}
        </motion.ul>
      </div>
    </section></Localized>
  );
}
