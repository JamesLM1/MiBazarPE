export type Period = "today" | "7d" | "30d" | "month";
export type ProductStock = { id_producto: string; nombre: string; stock_actual: number; stock_minimo: number; created_at: string };
export type InventorySummary = { total: number; normal: number; low: number; empty: number; alerts: ProductStock[] };
export type Activity = { id: string; kind: "product" | "client"; name: string; date: string };
export type DashboardData = {
  inventory: InventorySummary | null;
  activity: Activity[];
  inventoryError: boolean;
  activityError: boolean;
  hasBusiness: boolean;
};
export type PrivateUser = { id: string; email: string; name: string; role: string | null };
export type Business = { id: string; name: string; role: string };
export type PrivateContext = { user: PrivateUser; businesses: Business[]; business: Business | null; notice: string | null };
