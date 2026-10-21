import { BaziWorkspace } from "@/components/app-shell/bazi-workspace";
import { loadBazi } from "@/features/bazi/data";
import styles from "@/components/app-shell/operations.module.css";
import { unstable_rethrow } from "next/navigation";

export const metadata = { title: "Bazi · Tu asistente integrado" };
export default async function Page() {
  let data;
  try {
    data = await loadBazi();
  } catch (error) {
    unstable_rethrow(error);
  }
  if (!data) return <section className={styles.page}><h1>Bazi</h1><p role="alert">No pudimos comprobar el acceso a tu información. Actualiza la página o revisa tu perfil para continuar.</p></section>;
  return <BaziWorkspace key={data.scope} data={data}/>;
}
