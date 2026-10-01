"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, CreditCard, Fingerprint, Package, Search, ShoppingBag, Wallet } from "lucide-react";
import { ShowcaseDashboardPreview } from "./features-dashboard-preview";
import styles from "./features-dashboard.module.css";

export function FeaturesDashboard() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const cards = sectionRef.current?.querySelectorAll<HTMLElement>("[data-showcase-card]");
    if (!cards) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        (entry.target as HTMLElement).dataset.visible = String(entry.isIntersecting);
      }
    }, { threshold: 0.15 });
    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="como-funciona" className={styles.section} aria-labelledby="showcase-title">
      <h2 id="showcase-title" className="sr-only">Una mirada al panel de MiBazarPE</h2>
      <div className={styles.frame}>
        <div className={styles.grid}>
          <article className={`${styles.card} ${styles.mainCard}`} data-showcase-card>
            <div className={`${styles.visual} ${styles.dashboardVisual}`}>
              <div className={styles.browserFrame}>
                <div className={styles.browserBar} aria-hidden="true"><i /><i /><i /><span>MiBazarPE</span></div>
                <ShowcaseDashboardPreview />
              </div>
            </div>
            <div className={styles.copy}><h3>Resumen del negocio</h3><p>Ventas, inventario, clientes, créditos, pagos y caja en una misma vista. Explora una representación del panel previsto para MiBazarPE.</p></div>
          </article>
          <article className={styles.card} data-showcase-card>
            <div className={`${styles.visual} ${styles.analytics}`} role="img" aria-label="Gráfico ilustrativo de ventas y cobros. Datos ficticios, sin métricas reales.">
              <span className={styles.demoBadge}><ArrowUpRight size={14} aria-hidden="true" />DEMO</span>
              <svg aria-hidden="true" viewBox="0 0 340 240" preserveAspectRatio="none"><defs><linearGradient id="showcase-analysis-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d4d4d4" stopOpacity=".12" /><stop offset="1" stopColor="#d4d4d4" stopOpacity="0" /></linearGradient></defs><path d="M0 224C58 206 85 182 112 142S163 67 205 88 277 123 340 53V240H0Z" fill="url(#showcase-analysis-fill)" /><path className={styles.analysisLine} pathLength="1" d="M0 224C58 206 85 182 112 142S163 67 205 88 277 123 340 53" fill="none" stroke="#d4d4d4" strokeWidth="2" /></svg>
            </div>
            <div className={styles.copy}><h3>Reportes del negocio</h3><p>Una vista demostrativa de las ventas y los cobros para comprender los movimientos de tu bazar.</p></div>
          </article>
          <article className={styles.card} data-showcase-card>
            <div className={`${styles.visual} ${styles.moduleVisual}`} aria-hidden="true"><div className={styles.moduleTiles}><span><ShoppingBag size={24} /></span><span><Wallet size={24} /></span></div><small>Ventas y caja</small></div>
            <div className={styles.copy}><h3>Ventas y movimientos de caja</h3><p>Registros de ventas, ingresos y egresos organizados para revisar la actividad comercial del bazar.</p></div>
          </article>
          <article className={styles.card} data-showcase-card>
            <div className={`${styles.visual} ${styles.creditVisual}`} aria-hidden="true"><div className={styles.fingerprint}><Fingerprint size={88} strokeWidth={1.2} /><CreditCard className={styles.creditMark} size={22} strokeWidth={1.5} /></div></div>
            <div className={styles.copy}><h3>Créditos y pagos organizados</h3><p>Una representación del seguimiento de cuotas, saldos por cobrar y pagos asociados a cada cliente.</p></div>
          </article>
          <article className={styles.card} data-showcase-card>
            <div className={`${styles.visual} ${styles.catalogVisual}`} aria-hidden="true"><div className={styles.catalog}><div className={styles.catalogSearch}><Search size={14} /><span>Clientes y productos</span></div>{["Clientes", "Inventario", "Productos", "Movimientos"].map((label) => <div className={styles.catalogRow} key={label}><Package size={10} /><span>{label}</span><i /></div>)}</div></div>
            <div className={styles.copy}><h3>Clientes e inventario</h3><p>Información comercial y productos reunidos en el panel, con una estructura clara para consultar tu negocio.</p></div>
          </article>
        </div>
      </div>
      <p className={styles.disclaimer}>DEMO · DATOS FICTICIOS <span>Vista ilustrativa del alcance previsto. Sin operaciones reales.</span></p>
    </section>
  );
}
