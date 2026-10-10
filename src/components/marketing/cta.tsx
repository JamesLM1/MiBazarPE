"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowUpRight, Boxes, Check, CircleDollarSign, CreditCard, ReceiptText, UserRoundCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingEase } from "./landing-motion";
import styles from "./cta.module.css";

const operations = [
  { label: "Venta registrada", icon: ReceiptText, duration: 8.8, delay: -2.2 },
  { label: "Inventario actualizado", icon: Boxes, duration: 10.3, delay: -5.5 },
  { label: "Crédito controlado", icon: CreditCard, duration: 9.6, delay: -3.7 },
  { label: "Pago registrado", icon: CircleDollarSign, duration: 7.9, delay: -1.4 },
  { label: "Caja organizada", icon: Wallet, duration: 11.2, delay: -6.1 },
  { label: "Cliente registrado", icon: UserRoundCheck, duration: 9.1, delay: -4.8 },
] as const;

const reveal = {
  hidden: { opacity: 0, transform: "translateY(18px)" },
  visible: { opacity: 1, transform: "translateY(0px)" },
};

type CtaProps = {
  /** Supply an approved contact destination when this section is integrated. */
  contactHref?: string;
};

export function Cta({ contactHref }: CtaProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.1 });
  const reduced = useReducedMotion();

  return (
    <section ref={sectionRef} id="comenzar" className={styles.section} aria-labelledby="cta-title" data-running={inView && !reduced}>
      <div className={styles.panel}>
        <div className={styles.glow} aria-hidden="true" />
        <motion.div className={styles.content} initial={reduced ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.075 } } }}>
          <motion.p className={styles.eyebrow} variants={reveal} transition={{ duration: reduced ? 0 : 0.45, ease: landingEase }}>DA EL SIGUIENTE PASO</motion.p>
          <motion.h2 id="cta-title" variants={reveal} transition={{ duration: reduced ? 0 : 0.7, ease: landingEase }}>Organiza tu bazar desde un solo lugar</motion.h2>
          <motion.p className={styles.description} variants={reveal} transition={{ duration: reduced ? 0 : 0.6, ease: landingEase }}>Conoce cómo MiBazarPE busca centralizar ventas, inventario, clientes, créditos y movimientos del negocio.</motion.p>
          <motion.div className={styles.actions} variants={reveal} transition={{ duration: reduced ? 0 : 0.5, ease: landingEase }}>
            <Button asChild className={styles.primary}>
              <Link href="/#funciones" prefetch={false}>Conocer MiBazarPE<ArrowUpRight size={16} aria-hidden="true" /></Link>
            </Button>
            {contactHref ? (
              <Button asChild variant="outline" className={styles.secondary}><Link href={contactHref} prefetch={false}>Contáctanos</Link></Button>
            ) : (
              <Button type="button" variant="outline" className={styles.secondary} disabled title="Contacto próximamente">Contáctanos<span className="sr-only"> — próximamente</span></Button>
            )}
          </motion.div>
        </motion.div>
        <motion.ul className={styles.badges} aria-label="Representaciones visuales del alcance del sistema" initial={reduced ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
          {operations.map(({ label, icon: Icon, duration, delay }, index) => (
            <motion.li key={label} className={styles.slot} variants={{ hidden: { opacity: 0, transform: "translateY(12px) scale(.96)" }, visible: { opacity: 1, transform: "translateY(0px) scale(1)" } }} transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.15 + index * 0.075, ease: landingEase }} style={{ "--float-duration": `${duration}s`, "--float-delay": `${delay}s` } as CSSProperties}>
              <div className={styles.float}>
                <div className={styles.badge}>
                  <span className={styles.badgeGlow} aria-hidden="true" />
                  <span className={styles.icon}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /></span>
                  <span className={styles.badgeLabel}>{label}</span>
                  <Check className={styles.check} size={12} aria-hidden="true" />
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ul>
        <p className={styles.caption}>Representaciones del alcance de MiBazarPE.</p>
      </div>
    </section>
  );
}
