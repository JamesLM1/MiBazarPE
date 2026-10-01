import { ArrowUpRight, ChevronDown, CreditCard, LayoutDashboard, Package, Plus, Search, Settings2, ShoppingBag, Store, Users, Wallet } from "lucide-react";
import styles from "./hero.module.css";

// Illustration only: no services, financial calculations or interactive controls.
const navigation = [
  { label: "Resumen", icon: LayoutDashboard }, { label: "Ventas", icon: ShoppingBag },
  { label: "Inventario", icon: Package }, { label: "Clientes", icon: Users },
  { label: "Créditos", icon: CreditCard }, { label: "Caja", icon: Wallet },
];
const metrics = [
  { label: "Ventas del mes", value: "S/ 12,450", detail: "68 ventas registradas", note: "Resumen comercial del período" },
  { label: "Clientes activos", value: "124", detail: "Tu comunidad sigue creciendo", note: "18 clientes nuevos este mes" },
  { label: "Por cobrar", value: "S/ 2,180", detail: "12 créditos en seguimiento", note: "Consulta tus próximos cobros" },
  { label: "Caja disponible", value: "S/ 3,640", detail: "Movimientos del día", note: "Ingresos y egresos en un lugar" },
];
const operations = [
  ["Venta de productos", "Venta #0086", "Contado", "S/ 148.00"],
  ["Pago de cuota", "Crédito #0012", "Abono", "S/ 85.00"],
  ["Venta de productos", "Venta #0085", "Crédito", "S/ 230.00"],
  ["Ingreso a caja", "Movimiento #0048", "Efectivo", "S/ 120.00"],
];
const chartPoints = [155, 143, 158, 110, 138, 145, 92, 135, 120, 142, 100, 128, 69, 106, 117, 73, 103, 121, 55, 80, 99, 65, 115, 85, 125, 65, 94, 37, 66, 98, 44, 80, 55, 95, 31, 70, 89, 38, 68, 104, 49, 82, 33, 63, 94, 23, 49, 84, 31, 61, 13, 49, 73, 22, 57, 85, 32, 65, 18, 48];
function chartPath(points: number[]) {
  const step = 1000 / (points.length - 1);
  return `M 0 ${points[0]} ` + points.slice(0, -1).map((y, i) =>
    `Q ${i * step} ${y} ${(i + 0.5) * step} ${(y + points[i + 1]) / 2}`
  ).join(" ") + ` L 1000 ${points[points.length - 1]}`;
}
const line = chartPath(chartPoints);

export function HeroDashboardPreview() {
  return (
    <figure className={styles.preview} aria-labelledby="hero-preview-caption">
      <div role="img" aria-label="Vista ilustrativa de MiBazarPE con Resumen, Ventas, Inventario, Clientes, Créditos y Caja. Todos los datos son de demostración." className={styles.dashboard}>
        <div aria-hidden="true" className={styles.dashboardLayout}>
          <aside className={styles.sidebar}>
            <div className={styles.brand}><Store className="size-4" />MiBazarPE<ChevronDown className="ml-auto size-3" /></div>
            <div className={styles.quickCreate}><Plus className="size-3" />Nueva venta</div>
            <div>{navigation.map(({ label, icon: Icon }) => <div key={label} className={styles.navItem}><Icon className="size-3.5" />{label}</div>)}</div>
            <p className={styles.navLabel}>Mi negocio</p>
            <div className={styles.navItem}><Package className="size-3.5" />Productos</div>
            <div className={styles.navItem}><Wallet className="size-3.5" />Reportes</div>
            <div className={styles.navItem}><Settings2 className="size-3.5" />Configuración</div>
          </aside>
          <div className={styles.workspace}>
            <div className={styles.toolbar}>
              <span className={styles.toolbarTitle}><LayoutDashboard className="size-3.5" />Resumen</span>
              <span className={styles.demo}>DEMO · DATOS FICTICIOS</span>
            </div>
            <div className={styles.content}>
              <div className={styles.metrics}>
                {metrics.map(({ label, value, detail, note }) => <div key={label} className={styles.metric}>
                  <p className={styles.metricLabel}>{label}<ArrowUpRight className="size-3 shrink-0" /></p>
                  <p className={styles.metricValue}>{value}</p>
                  <p className={styles.metricDetail}>{detail}</p>
                  <p className={styles.metricNote}>{note}</p>
                </div>)}
              </div>
              <div className={styles.chart}>
                <div className={styles.chartHeader}>
                  <div>Resumen de ventas<p className="mt-1 text-[10px] text-muted-foreground">Ventas durante los últimos 3 meses</p></div>
                  <div className={styles.chartFilters}><span>Últimos 3 meses</span><span>Últimos 30 días</span><span>Últimos 7 días</span></div>
                </div>
                <svg className={styles.chartSvg} viewBox="0 0 1000 180" preserveAspectRatio="none" fill="none">
                  <defs><linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".35" /><stop offset="1" stopColor="currentColor" stopOpacity=".02" /></linearGradient></defs>
                  {[30, 70, 110, 150].map(y => <path key={y} d={`M0 ${y}H1000`} stroke="currentColor" strokeOpacity=".06" />)}
                  <path d={`${line} L1000 180 L0 180 Z`} fill="url(#hero-chart-fill)" />
                  <path d={line} stroke="currentColor" strokeWidth="1.5" strokeOpacity=".6" />
                  <path d={chartPath(chartPoints.map(y => Math.min(178, y * 0.6 + 75)))} stroke="currentColor" strokeOpacity=".25" strokeWidth="1.2" />
                </svg>
                <div className={styles.chartDates}>{["01 Jul", "15 Jul", "01 Ago", "15 Ago", "01 Sep", "15 Sep", "30 Sep"].map(d => <span key={d}>{d}</span>)}</div>
              </div>
              <div className={styles.table}>
                <div className={styles.tableHeading}><span>Operaciones recientes</span><Search className="size-3.5 text-muted-foreground" /></div>
                <div className={styles.tableRow}><span>Operación</span><span>Referencia</span><span>Modalidad</span><span>Monto</span></div>
                {operations.map(row => <div key={row[1]} className={styles.tableRow}>{row.map(value => <span key={value}>{value}</span>)}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption id="hero-preview-caption" className={styles.caption}>Vista previa del producto. Datos de demostración.</figcaption>
    </figure>
  );
}
