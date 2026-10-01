"use client";
import { motion, useReducedMotion } from "motion/react";
import { landingEase, landingEntrance, usePointerDepth } from "./landing-motion";
import { ArrowUpRight, Check, Layers } from "lucide-react";
import styles from "./pricing.module.css";

const plans = [
  { name: "Inicial", description: "Para pequeños bazares que desean organizar las operaciones esenciales.", features: ["Ventas", "Productos", "Inventario", "Clientes", "Caja"] },
  { name: "Negocio", description: "Para bazares que necesitan controlar ventas, créditos y movimientos con mayor detalle.", features: ["Todo lo del plan Inicial", "Créditos", "Cuotas y pagos", "Cuentas por cobrar", "Reportes", "Seguimiento del negocio"], featured: true },
  { name: "Completo", description: "Para una gestión más integral del negocio y futuras capacidades de MiBazarPE.", features: ["Todo lo del plan Negocio", "Reportes ampliados", "Herramientas de análisis", "Gestión avanzada", "Acceso a futuras funciones inteligentes"] },
];

function PlanCard({ plan, index }: { plan: typeof plans[number]; index: number }) {
  const reduced = useReducedMotion();
  const depth = usePointerDepth();
  return <motion.div className={styles.slot} initial={reduced ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={landingEntrance} transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : index * 0.14, ease: landingEase }}>
    <motion.article className={`${styles.plan} ${plan.featured ? styles.featured : ""}`} style={{ transform: depth.transform }} {...depth.handlers}>
      <motion.div className={styles.spotlight} aria-hidden="true" style={{ transform: depth.reflection, opacity: depth.presence }} />
      <div className={styles.planTop}>
        <div className={styles.planHeading}><h3>Plan {plan.name}</h3>{plan.featured && <span className={styles.badge}><Layers size={12} aria-hidden="true" />Recomendado</span>}</div>
        <p className={styles.status}>Próximamente</p>
        <p className={styles.description}>{plan.description}</p>
      </div>
      <div className={styles.planBody}>
        <p className={styles.includes}>Alcance propuesto</p>
        <motion.ul initial={reduced ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.075, delayChildren: reduced ? 0 : 0.2 } } }}>
          {plan.features.map(feature => <motion.li key={feature} variants={landingEntrance} transition={{ duration: reduced ? 0 : 0.4, ease: landingEase }}><Check size={14} aria-hidden="true" /><span>{feature}</span></motion.li>)}
        </motion.ul>
        {plan.name === "Completo" && <p className={styles.future}>Las funciones inteligentes corresponden a etapas futuras.</p>}
      </div>
      <div className={styles.planFooter}><a className={styles.cta} href="#funciones" aria-label={`Explorar las funciones previstas del plan ${plan.name}`}>Explorar funciones<ArrowUpRight size={14} aria-hidden="true" /></a></div>
    </motion.article>
  </motion.div>;
}

export function Pricing() {
  const reduced = useReducedMotion();
  const reveal = { variants: landingEntrance, transition: { duration: reduced ? 0 : 0.55, ease: landingEase } };
  return <section id="planes" className={styles.section} aria-labelledby="pricing-title">
    <div className={styles.container}>
      <motion.header className={styles.intro} initial={reduced ? false : "hidden"} whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.1 } } }}>
        <motion.p {...reveal} className={styles.eyebrow}>PROPUESTAS DE PLANES</motion.p>
        <motion.h2 {...reveal} id="pricing-title">Un punto de partida.<br />Espacio para crecer.</motion.h2>
        <motion.p {...reveal}>Tres propuestas para distintas necesidades de tu bazar. MiBazarPE es un proyecto académico en desarrollo: los planes y sus condiciones comerciales aún no están definidos.</motion.p>
      </motion.header>
      <div className={styles.grid}>{plans.map((plan, index) => <PlanCard key={plan.name} plan={plan} index={index} />)}</div>
    </div>
  </section>;
}