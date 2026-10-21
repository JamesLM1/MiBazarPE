import type { Activity, InventorySummary, Period, ProductStock } from "./types";

export const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Hoy" }, { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" }, { value: "month", label: "Este mes" },
];
export function parsePeriod(value?: string): Period {
  return periods.some(period => period.value === value) ? value as Period : "today";
}
// All business calendar boundaries use Peru time (UTC-5, no DST).
export function periodStart(period: Period, now = new Date()): string {
  const local = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const date = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), period === "month" ? 1 : local.getUTCDate(), 5));
  if (period === "7d" || period === "30d") date.setUTCDate(date.getUTCDate() - (period === "7d" ? 6 : 29));
  return date.toISOString();
}
export function summarizeInventory(products: ProductStock[]): InventorySummary {
  const result: InventorySummary = { total: products.length, normal: 0, low: 0, empty: 0, alerts: [] };
  for (const product of products) {
    if (product.stock_actual === 0) result.empty++;
    else if (product.stock_actual <= product.stock_minimo) result.low++;
    else result.normal++;
    if (product.stock_actual <= product.stock_minimo) result.alerts.push(product);
  }
  result.alerts.sort((a, b) => a.stock_actual - b.stock_actual || a.nombre.localeCompare(b.nombre, "es"));
  return result;
}
export function recentActivity(items: Activity[]): Activity[] {
  return [...items].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 6);
}
export function displayRole(role: string | null) {
  // UI labels only. Authorization continues to use the original database roles.
  const labels: Record<string, string> = { DUENO_BAZAR: "Dueño de bazar", CLIENTE: "Cliente", SUPERADMIN: "Superadministrador", PROPIETARIO: "Dueño de bazar", COLABORADOR: "Vendedor" };
  return role ? labels[role] ?? "Rol no disponible" : "Cuenta sin perfil";
}
export function money(value: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
}
