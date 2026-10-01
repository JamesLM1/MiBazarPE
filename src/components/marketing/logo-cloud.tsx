"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import styles from "./logo-cloud.module.css";

const technologies = [
  { name: "Next.js", icon: "nextdotjs" },
  { name: "React", icon: "react" },
  { name: "Supabase", icon: "supabase" },
  { name: "PostgreSQL", icon: "postgresql" },
  { name: "TypeScript", icon: "typescript" },
  { name: "Tailwind CSS", icon: "tailwindcss" },
  { name: "Cloudflare", icon: "cloudflare" },
  { name: "Brevo", icon: "brevo" },
];

export function LogoCloud() {
  const [paused, setPaused] = useState(false);

  return (
    <section id="tecnologias" aria-labelledby="technology-title" className={styles.section}>
      <div className={styles.panel}>
        <div className={styles.copy}>
          <Image src="/brand/mibazarpe-logo.png" alt="MiBazarPE" width={2172} height={724} unoptimized className={styles.brand} />
          <h2 id="technology-title" className={styles.heading}>Construido con tecnologías modernas para gestionar tu bazar.</h2>
          <Link href="#inicio" className={styles.cta}>Conocer MiBazarPE<ExternalLink aria-hidden="true" className="size-3.5" /></Link>
        </div>
        <div className={styles.visual} data-paused={paused}>
          <button type="button" className={styles.pause} aria-pressed={paused} onClick={() => setPaused(!paused)}>
            {paused ? "Reanudar animación de tecnologías" : "Pausar animación de tecnologías"}
          </button>
          <ul className="sr-only" aria-label="Tecnologías seleccionadas para MiBazarPE">
            {technologies.map(({ name }) => <li key={name}>{name}</li>)}
          </ul>
          <div aria-hidden="true" className={styles.columns}>
            {[technologies.slice(0, 4), technologies.slice(4)].map((column, columnIndex) => (
              <div key={columnIndex} className={styles.column}>
                <div className={styles.track}>
                  {[0, 1].map(copy => <div key={copy} className={styles.group}>
                    {column.map(({ name, icon }, index) => (
                      <div key={icon} className={`${styles.logoSlot} ${(index + columnIndex) % 2 === 0 ? styles.card : ""}`}>
                        <span className={styles.wordmark}>
                          <Image src={`/technologies/${icon}.svg`} alt="" width={22} height={22} loading="eager" className={styles.icon} />
                          <span>{name}</span>
                        </span>
                      </div>
                    ))}
                  </div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
