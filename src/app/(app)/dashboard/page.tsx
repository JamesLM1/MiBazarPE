import { Dashboard } from "@/components/app-shell/dashboard";
import { getPrivateContext } from "@/features/dashboard/context";
import { loadDashboard } from "@/features/dashboard/service";
import { loadFinancialOverview } from "@/features/dashboard/financial";
import { redirect } from "next/navigation";

export const metadata = { title: "Dashboard" };
export default async function DashboardPage() {
  const context = await getPrivateContext();
  if(context.user.role==='CLIENTE') redirect('/portal');
  const data = await loadDashboard();
  const financial = await loadFinancialOverview(context);
  return <Dashboard context={context} data={data} financial={financial} />;
}
