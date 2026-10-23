import { redirect } from "next/navigation";
import { getPrivateContext } from "@/features/dashboard/context";
import { BusinessSettings } from "@/components/app-shell/business-settings";
import { ImportWizard } from "@/components/imports/import-wizard";

export const metadata = { title: "Importar datos" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const context = await getPrivateContext();
  if (context.user.role === "CLIENTE") redirect("/portal");
  if (!context.user.role) redirect("/perfil");
  const query = await searchParams;
  return <ImportWizard key={context.user.id} business={context.business} businessSetup={!context.business ? <BusinessSettings create inline/> : undefined} initialKind={query.tipo === "clientes" ? "clientes" : "productos"} />;
}
