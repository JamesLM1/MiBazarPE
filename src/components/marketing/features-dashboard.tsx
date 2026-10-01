"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, Check, CreditCard, Package, RotateCcw, Search, ShoppingBag, Users, Wallet } from "lucide-react";
import { ShowcaseDashboardPreview } from "./features-dashboard-preview";
import { CountUp, landingEntrance, usePointerDepth } from "./landing-motion";
import styles from "./features-dashboard.module.css";

const easeOut = [0.23, 1, 0.32, 1] as const;
const entrance = landingEntrance;

export function FeaturesDashboard() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [demoRun, setDemoRun] = useState(0);
  const reducedMotion = useReducedMotion();
  const depth = usePointerDepth();
  const { scrollYProgress } = useScroll({ target: panelRef, offset: ["start end", "end center"] });
  const progress = useSpring(scrollYProgress, { stiffness: 130, damping: 30, restDelta: 0.001 });
  const panelTransform = useTransform(progress, [0, 0.5, 1], [
    "perspective(1400px) rotateX(9deg) translateY(76px) scale(.94)",
    "perspective(1400px) rotateX(4deg) translateY(26px) scale(.98)",
    "perspective(1400px) rotateX(0deg) translateY(0px) scale(1)",
  ]);
  const panelOpacity = useTransform(progress, [0, 0.35, 0.7], [0.18, 0.72, 1]);
  const paymentTransform = useTransform(scrollYProgress, [0, 1], ["translateY(36px)", "translateY(-6px)"]);
  const stockTransform = useTransform(scrollYProgress, [0, 1], ["translateY(22px)", "translateY(-12px)"]);
  const reveal = (delay = 0) => ({
    initial: reducedMotion ? false as const : "hidden",
    whileInView: "visible",
    viewport: { once: true, amount: 0.2 },
    variants: entrance,
    transition: { duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : delay, ease: easeOut },
  });

  return (
    <section id="como-funciona" className={styles.section} aria-labelledby="showcase-title">
      <motion.div className={styles.intro} {...reveal()}>
        <p className={styles.eyebrow}>UNA MIRADA A MIBAZARPE <span>DEMO</span></p>
        <h2 id="showcase-title">Todo tu bazar.<br /><span>Una sola vista.</span></h2>
        <p>De la venta al cobro, del inventario a la caja. Así se organiza el negocio en el panel previsto de MiBazarPE.</p>
      </motion.div>
      <div className={styles.frame}>
        <div className={styles.grid}>
          <article className={`${styles.card} ${styles.mainCard}`}>
            <div ref={panelRef} className={styles.dashboardStage}>
              <div className={styles.stageGrid} aria-hidden="true" />
              <motion.div className={styles.scrollPanel} style={reducedMotion ? undefined : { transform: panelTransform, opacity: panelOpacity }}>
              <motion.div className={styles.browserFrame} style={{ transform: depth.transform }} {...depth.handlers}>
                <div className={styles.browserBar} aria-hidden="true"><i /><i /><i /><span>MiBazarPE · Resumen del negocio</span></div>
                <motion.div className={styles.innerDepth} style={reducedMotion ? undefined : { transform: depth.layer }}>
                <ShowcaseDashboardPreview key={demoRun} />
                </motion.div>
                <motion.div aria-hidden="true" className={styles.reflection} style={{ transform: depth.reflection, opacity: depth.presence }} />
              </motion.div>
              </motion.div>
              <motion.div className={`${styles.floating} ${styles.paymentFloat}`} style={reducedMotion ? undefined : { transform: paymentTransform }} {...reveal(0.2)} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                <span className={styles.floatIcon}><ArrowDownLeft size={16} aria-hidden="true" /></span><div><small>Pago de cuota · DEMO</small><strong>S/ 85.00</strong><span>Abono registrado en la muestra</span></div><Check size={13} aria-hidden="true" />
              </motion.div>
              <motion.div className={`${styles.floating} ${styles.stockFloat}`} style={reducedMotion ? undefined : { transform: stockTransform }} {...reveal(0.3)} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                <span className={styles.floatIcon}><Package size={16} aria-hidden="true" /></span><div><small>Inventario · DEMO</small><strong>Productos y movimientos</strong><span>El contexto de cada venta</span></div>
              </motion.div>
            </div>
            <div className={styles.mainCopy}><div><h3>El negocio, conectado en un mismo panel</h3><p>Ventas, clientes, inventario, créditos, pagos y caja. Una representación visual de cómo se reúne la información comercial.</p></div><div className={styles.demoControls}><span className={styles.demoLabel}>DEMO · DATOS FICTICIOS</span><button type="button" onClick={() => setDemoRun(run => run + 1)} aria-label="Repetir las animaciones de la demostración de MiBazarPE"><RotateCcw size={13} aria-hidden="true" />Repetir demo</button></div></div>
          </article>

          <motion.article key={`reports-${demoRun}`} className={styles.card} {...reveal()}>
            <div className={styles.copy}><h3>Comprende tus movimientos</h3><p>Ventas y cobros puestos en contexto para revisar el resumen comercial de tu bazar.</p></div>
            <div className={`${styles.scene} ${styles.analytics}`} role="img" aria-label="Gráfico ilustrativo del negocio. DEMO, datos ficticios.">
              <div className={styles.chartLegend}><span>Resumen comercial</span><small>DEMO · DATOS FICTICIOS</small></div>
              <div className={styles.chartValue}><CountUp value={12450} prefix="S/ " /> <ArrowUpRight size={14} aria-hidden="true" /></div>
              <svg aria-hidden="true" viewBox="0 0 480 160" preserveAspectRatio="none"><defs><linearGradient id="showcase-analysis-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d4d4d4" stopOpacity=".16" /><stop offset="1" stopColor="#d4d4d4" stopOpacity="0" /></linearGradient></defs>{[40, 80, 120].map(y => <path key={y} d={`M0 ${y}H480`} stroke="#fff" strokeOpacity=".04" />)}<motion.path initial={reducedMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: reducedMotion ? 0 : 0.8 }} d="M0 147C54 144 62 109 110 115S160 79 207 81 252 27 290 43 355 70 397 39 435 42 480 10V160H0Z" fill="url(#showcase-analysis-fill)" /><motion.path initial={reducedMotion ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: reducedMotion ? 0 : 1.2, ease: easeOut }} d="M0 147C54 144 62 109 110 115S160 79 207 81 252 27 290 43 355 70 397 39 435 42 480 10" fill="none" stroke="#d4d4d4" strokeWidth="2" /></svg>
              <div className={styles.chartDates}><span>Jul</span><span>Ago</span><span>Sep · DEMO</span></div>
            </div>
          </motion.article>

          <motion.article key={`activity-${demoRun}`} className={styles.card} {...reveal(0.16)}>
            <div className={styles.copy}><h3>De la venta a la caja</h3><p>Cada movimiento con su referencia: ventas, ingresos y egresos en una vista organizada.</p></div>
            <motion.div className={`${styles.scene} ${styles.activityScene}`} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={{ visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.15 } } }}>
              <div className={styles.windowTitle}><Wallet size={14} aria-hidden="true" />Movimientos recientes <small>DEMO</small></div>
              {[{ icon: ShoppingBag, title: "Venta de productos", detail: "Venta #0086 · Contado", value: "+ S/ 148.00" }, { icon: CreditCard, title: "Pago de cuota", detail: "Crédito #0012 · Abono", value: "+ S/ 85.00" }, { icon: Wallet, title: "Ingreso a caja", detail: "Movimiento #0048", value: "+ S/ 120.00" }].map(({ icon: Icon, title, detail, value }) => <motion.div className={styles.activityRow} key={title} variants={reducedMotion ? {} : entrance} transition={{ duration: 0.5, ease: easeOut }}><span className={styles.rowIcon}><Icon size={14} aria-hidden="true" /></span><div><strong>{title}</strong><small>{detail}</small></div><span>{value}</span></motion.div>)}
            </motion.div>
          </motion.article>

          <motion.article key={`credit-${demoRun}`} className={styles.card} {...reveal()}>
            <div className={styles.copy}><h3>Un seguimiento claro del crédito</h3><p>Cuotas, saldos por cobrar y pagos asociados a cada cliente, dentro del alcance previsto del sistema.</p></div>
            <div className={`${styles.scene} ${styles.creditScene}`}>
              <motion.div className={styles.creditWindow} {...reveal(0.15)}><div className={styles.windowTitle}><CreditCard size={14} aria-hidden="true" />Seguimiento de crédito <small>DEMO</small></div><div className={styles.creditSummary}><span>Por cobrar<strong>S/ 2,180</strong></span><span className={styles.clientTag}><Users size={12} aria-hidden="true" />Clientes</span></div><div className={styles.installments}>{["Cuota 01", "Cuota 02", "Cuota 03", "Cuota 04"].map((label, i) => <motion.span key={label} initial={reducedMotion ? false : { opacity: 0, transform: "translateY(8px)" }} whileInView={{ opacity: 1, transform: "translateY(0px)" }} viewport={{ once: true }} transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.2 + i * 0.2, ease: easeOut }}><i>{i < 2 ? <Check size={12} aria-hidden="true" /> : i + 1}</i>{label}</motion.span>)}</div><p>Secuencia ilustrativa · datos ficticios</p></motion.div>
              <motion.div className={styles.paymentSlip} {...reveal(0.95)}><Check size={14} aria-hidden="true" /><div><strong>Pago de cuota</strong><span>S/ 85.00 · DEMO</span></div></motion.div>
            </div>
          </motion.article>

          <motion.article key={`inventory-${demoRun}`} className={styles.card} {...reveal(0.16)}>
            <div className={styles.copy}><h3>Clientes e inventario, a la mano</h3><p>Información comercial y productos reunidos en un mismo lugar, con el contexto de sus movimientos.</p></div>
            <div className={`${styles.scene} ${styles.catalogScene}`}><motion.div className={styles.catalog} {...reveal(0.2)}><div className={styles.catalogSearch}><Search size={14} aria-hidden="true" /><span>Productos del bazar</span><small>DEMO</small></div>{[{ name: "Cuaderno A4", sku: "PRD-001", stock: "24 unid." }, { name: "Lapicero azul", sku: "PRD-002", stock: "48 unid." }, { name: "Papel bond", sku: "PRD-003", stock: "12 unid." }].map((product, i) => <motion.div className={styles.catalogRow} key={product.sku} initial={reducedMotion ? false : { opacity: 0, transform: "translateX(14px)" }} whileInView={{ opacity: 1, transform: "translateX(0px)" }} viewport={{ once: true }} transition={{ duration: 0.5, delay: reducedMotion ? 0 : i * 0.12, ease: easeOut }}><span className={styles.rowIcon}><Package size={14} aria-hidden="true" /></span><div><strong>{product.name}</strong><small>{product.sku}</small></div><span>{product.stock}</span></motion.div>)}</motion.div><motion.div className={styles.clientNote} {...reveal(0.35)}><Users size={16} aria-hidden="true" /><span><strong><CountUp value={124} /></strong> clientes activos · DEMO</span></motion.div></div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
