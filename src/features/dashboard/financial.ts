import "server-only";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { PrivateContext } from "./types";
import { unavailableFinancialOverview, type FinancialOverview } from "./presentation";

type FinancialPayload = FinancialOverview & {
  payables: string;
  creditClients: number;
  otherCurrencies: boolean;
};

function isFinancialPayload(value: unknown): value is FinancialPayload {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<FinancialPayload>;
  return (data.source === "live" || data.source === "database-demo")
    && typeof data.todaySales === "string"
    && typeof data.todayIncome === "string"
    && typeof data.receivables === "string"
    && typeof data.payables === "string"
    && typeof data.creditClients === "number"
    && Boolean(data.sales && Array.isArray(data.sales.day) && Array.isArray(data.sales.week)
      && Array.isArray(data.sales.month) && Array.isArray(data.sales.year))
    && Array.isArray(data.categories) && Array.isArray(data.accountStates) && Array.isArray(data.due);
}

export async function loadFinancialOverview(context: PrivateContext): Promise<FinancialOverview> {
  if (!context.business) return unavailableFinancialOverview();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("dashboard_resumen", { p_bazar: context.business.id });
  if (error || !isFinancialPayload(data)) return unavailableFinancialOverview();
  return data;
}
