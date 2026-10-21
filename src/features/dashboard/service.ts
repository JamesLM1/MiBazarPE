import "server-only";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getPrivateContext } from "./context";
import { recentActivity, summarizeInventory } from "./model";
import type { DashboardData, ProductStock } from "./types";

export async function loadDashboard(): Promise<DashboardData> {
  const { business } = await getPrivateContext();
  const empty: DashboardData = { inventory: null, activity: [], inventoryError: false, activityError: false, hasBusiness: Boolean(business) };
  if (!business) return empty;
  const supabase = await getSupabaseServerClient();
  const until = new Date().toISOString();
  async function inventory() {
    const rows: ProductStock[] = [];
    // Read all pages so the default PostgREST row limit never silently truncates a KPI.
    for (let offset = 0; ; offset += 500) {
      const result = await supabase.from("productos").select("id_producto,nombre,stock_actual,stock_minimo,created_at")
        .eq("id_bazar", business!.id).eq("estado", "ACTIVO").order("id_producto").range(offset, offset + 499);
      if (result.error) throw new Error("INVENTORY_UNAVAILABLE");
      rows.push(...result.data);
      if (result.data.length < 500) break;
    }
    return rows;
  }
  const [products, clients] = await Promise.allSettled([
    inventory(),
    supabase.from("clientes").select("id_cliente,nombre_completo,created_at").eq("id_bazar", business.id)
      .lte("created_at", until).order("created_at", { ascending: false }).order("id_cliente").limit(6),
  ]);
  const inventoryError = products.status === "rejected";
  const activityError = inventoryError || clients.status === "rejected" || Boolean(clients.value.error);
  const rows = products.status === "fulfilled" ? products.value : [];
  const clientRows = clients.status === "fulfilled" && !clients.value.error ? clients.value.data : [];
  return {
    hasBusiness: true, inventoryError, activityError,
    inventory: inventoryError ? null : summarizeInventory(rows),
    activity: recentActivity([
      // Latest registrations retain their actual dates, even when none were added today.
      ...rows.filter(row => row.created_at <= until).map(row => ({ id: row.id_producto, kind: "product" as const, name: row.nombre, date: row.created_at })),
      ...clientRows.map(row => ({ id: row.id_cliente, kind: "client" as const, name: row.nombre_completo, date: row.created_at })),
    ]),
  };
}
