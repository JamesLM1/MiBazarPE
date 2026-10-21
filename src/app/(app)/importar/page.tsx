import { redirect } from "next/navigation";
import { getPrivateContext } from "@/features/dashboard/context";
import { ImportWizard } from "@/components/imports/import-wizard";

export const metadata = { title: "Importar datos" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const context = await getPrivateContext();
  if (context.user.role === "CLIENTE") redirect("/portal");
  if (!context.user.role) redirect("/perfil");
  const query = await searchParams;
  return <ImportWizard key={`${context.user.id}:${context.business?.id ?? "sin-negocio"}`} business={context.business} initialKind={query.tipo === "clientes" ? "clientes" : "productos"} />;
}
