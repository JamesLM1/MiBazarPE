import { ArrowUpRight, Check, Layers } from "lucide-react";
import styles from "./pricing.module.css";

const plans = [
  { name: "Inicial", description: "Para pequeños bazares que desean organizar las operaciones esenciales.", features: ["Ventas", "Productos", "Inventario", "Clientes", "Caja"] },
  { name: "Negocio", description: "Para bazares que necesitan controlar ventas, créditos y movimientos con mayor detalle.", features: ["Todo lo del plan Inicial", "Créditos", "Cuotas y pagos", "Cuentas por cobrar", "Reportes", "Seguimiento del negocio"], featured: true },
  { name: "Completo", description: "Para una gestión más integral del negocio y futuras capacidades de MiBazarPE.", features: ["Todo lo del plan Negocio", "Reportes ampliados", "Herramientas de análisis", "Gestión avanzada", "Acceso a futuras funciones inteligentes"] },
];

export function Pricing() {
  return (
    <section id="planes" className={styles.section} aria-labelledby="pricing-title">
      <div className={styles.container}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>PROPUESTAS DE PLANES</p>
          <h2 id="pricing-title">Un punto de partida.<br />Espacio para crecer.</h2>
          <p>Tres propuestas para distintas necesidades de tu bazar. MiBazarPE es un proyecto académico en desarrollo: los planes y sus condiciones comerciales aún no están definidos.</p>
        </header>
        <div className={styles.grid}>
          {plans.map(plan => (
            <article key={plan.name} className={`${styles.plan} ${plan.featured ? styles.featured : ""}`}>
              <div className={styles.planHeading}><h3>Plan {plan.name}</h3>{plan.featured && <span className={styles.badge}><Layers size={12} aria-hidden="true" />Recomendado</span>}</div>
              <p className={styles.status}>Próximamente</p>
              <p className={styles.description}>{plan.description}</p>
              <a className={styles.cta} href="#funciones" aria-label={`Explorar las funciones previstas del plan ${plan.name}`}>Explorar funciones<ArrowUpRight size={14} aria-hidden="true" /></a>
              <p className={styles.includes}>Alcance propuesto</p>
              <ul>{plan.features.map(feature => <li key={feature}><Check size={14} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
              {plan.name === "Completo" && <p className={styles.future}>Las funciones inteligentes corresponden a etapas futuras.</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
