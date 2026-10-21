import styles from "@/components/app-shell/dashboard.module.css";

export default function DashboardLoading() {
  return <div role="status" aria-label="Cargando resumen de tu negocio" aria-busy="true"><div className={`${styles.skeleton} ${styles.skeletonHeading}`} /><div className={styles.grid}>{[0, 1, 2, 3].map(item => <div key={item} className={`${styles.skeleton} ${styles.skeletonKpi}`} />)}{[0, 1].map(item => <div key={item} className={`${styles.skeleton} ${styles.skeletonChart}`} />)}{[0, 1, 2, 3].map(item => <div key={item} className={`${styles.skeleton} ${styles.skeletonSection}`} />)}</div></div>;
}
