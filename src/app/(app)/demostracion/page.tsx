import { RevealHeading } from "@/components/app-shell/reveal-heading";
import Link from "next/link";
import { getPrivateContext } from "@/features/dashboard/context";
import styles from "@/components/app-shell/operations.module.css";

import {DemoCatalog} from "@/components/public-apis/demo-catalog";

export const metadata = { title: "Recorrido de MiBazarPE" };

export default async function DemonstrationPage() {
  const context = await getPrivateContext();
  return <section className={styles.page}>
    <header><p className={styles.eyebrow}>CONOCE MIBAZARPE</p><RevealHeading>Un recorrido por tu negocio</RevealHeading><p>Del resumen del día al detalle de cada cuota.</p></header>
    <section className={styles.formCard} aria-label="Video de demostración">
      <video controls playsInline preload="metadata" poster="/demo/portada.jpg" aria-label="Recorrido visual por MiBazarPE con datos de muestra" style={{width:"100%",height:"auto",aspectRatio:"16 / 9",borderRadius:16,background:"#090d15"}}>
        <source src="/demo/mibazarpe-recorrido.mp4" type="video/mp4" />
        Tu navegador no puede reproducir este video. Puedes descargarlo desde el enlace de abajo.
      </video>
      <p className={styles.formHint}>32 segundos · Sin audio · Capturas reales de la aplicación con datos ficticios. El video no modifica tus registros.</p>
      <a href="/demo/mibazarpe-recorrido.mp4" download>Descargar video para la presentación</a>
    </section>
    <section className={styles.formCard}><h2>Lo que muestra el recorrido</h2><ol>
      <li><strong>Inicio:</strong> ventas, ingresos, cartera y próximos vencimientos del bazar seleccionado.</li>
      <li><strong>Venta a crédito:</strong> capital, tasa y cronograma antes de confirmar la operación.</li>
      <li><strong>Reportes:</strong> comparación mensual de ventas al contado y a crédito.</li>
      <li><strong>Bazi:</strong> ayuda y recomendaciones a partir de las reglas del negocio.</li>
    </ol><p>Los bazares marcados como DEMO contienen datos de muestra. Un negocio nuevo mantiene sus propios clientes, inventario y operaciones.</p></section>
    {context.business&&["DUENO_BAZAR","SUPERADMIN"].includes(context.user.role??"")&&(context.business.role==="PROPIETARIO"||context.user.role==="SUPERADMIN")&&<DemoCatalog key={context.business.id} businessId={context.business.id}/>}
    <Link className={styles.submit} href={context.user.role === "CLIENTE" ? "/portal" : "/dashboard"}>Volver a mi espacio</Link>
  </section>;
}
