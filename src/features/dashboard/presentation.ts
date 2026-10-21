// Amounts remain decimal strings at the data boundary. Numbers in charts are
// for plotting only, never for accounting or financial calculations.
export type SalesPeriod = "day" | "week" | "month" | "year";
export type SalesPoint = { label: string; amount: number };
export type Breakdown = { name: string; amount: number; fill: string };
export type DuePayment = {
  id: string; dayLabel: string; date: string; name: string; detail: string;
  amount: string; status: "Pendiente" | "Próximo a vencer";
  kind: "receivable" | "payable";
};
export type FinancialOverview = {
  source: "demo" | "database-demo" | "live" | "unavailable";
  todaySales: string | null; todayIncome: string | null; receivables: string | null;
  payables?: string; creditClients?: number; otherCurrencies?: boolean;
  sales: Record<SalesPeriod, SalesPoint[]>;
  categories: Breakdown[]; accountStates: Breakdown[]; due: DuePayment[];
};
export const salesPeriods: { value: SalesPeriod; label: string }[] = [
  { value: "day", label: "Día" }, { value: "week", label: "Semana" },
  { value: "month", label: "Mes" }, { value: "year", label: "Año" },
];
// Replace only after verifying the source schema and querying under RLS.
export function unavailableFinancialOverview(): FinancialOverview {
  return { source: "unavailable", todaySales: null, todayIncome: null, receivables: null,
    sales: { day: [], week: [], month: [], year: [] }, categories: [], accountStates: [], due: [] };
}
