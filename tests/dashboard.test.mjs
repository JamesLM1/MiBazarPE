import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { summarizeInventory, periodStart, parsePeriod, recentActivity, displayRole } from "../src/features/dashboard/model.ts";

test("inventory partitions zero, low and normal without double counting", () => {
  const products = [[0, 0], [0, 5], [5, 5], [4, 5], [6, 5]].map(([stock_actual, stock_minimo], index) => ({ id_producto: String(index), nombre: `Item ${index}`, stock_actual, stock_minimo, created_at: "2026-10-10T05:00:00Z" }));
  const result = summarizeInventory(products);
  assert.deepEqual([result.total, result.normal, result.low, result.empty, result.alerts.length], [5, 1, 2, 2, 4]);
  assert.equal(result.normal + result.low + result.empty, result.total);
  assert.equal(summarizeInventory([]).total, 0);
});
test("periods use Peru midnight, inclusive seven days and month boundaries", () => {
  const now = new Date("2026-03-01T04:30:00Z");
  assert.equal(periodStart("today", now), "2026-02-28T05:00:00.000Z");
  assert.equal(periodStart("7d", now), "2026-02-22T05:00:00.000Z");
  assert.equal(periodStart("30d", now), "2026-01-30T05:00:00.000Z");
  assert.equal(periodStart("month", now), "2026-02-01T05:00:00.000Z");
  assert.equal(parsePeriod("anything"), "today");
});
test("activity merges sources, sorts by instant and returns at most six items", () => {
  const rows = Array.from({ length: 9 }, (_, i) => ({ id: String(i), kind: i % 2 ? "product" : "client", name: "Test", date: `2026-10-10T0${i}:00:00Z` }));
  assert.deepEqual(recentActivity(rows).map(row => row.id), ["8", "7", "6", "5", "4", "3"]);
  assert.equal(rows[0].id, "0");
});
test("role labels adapt existing roles without assigning permissions", () => {
  assert.equal(displayRole("DUENO_BAZAR"), "Dueño de bazar");
  assert.equal(displayRole("COLABORADOR"), "Vendedor");
  assert.equal(displayRole(null), "Cuenta sin perfil");
  assert.equal(displayRole("ADMINISTRADOR"), "Rol no disponible");
});
test("every private module has a page and is covered by the existing proxy", () => {
  const proxy = readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");
  for (const route of ["dashboard", "cuentas-por-cobrar", "cuentas-por-pagar", "mi-negocio", "ventas", "compras", "inventario", "clientes", "creditos", "pagos", "caja", "reportes", "bazi", "configuracion", "perfil"]) {
    assert.ok(readFileSync(new URL(`../src/app/(app)/${route}/page.tsx`, import.meta.url), "utf8").length);
    assert.ok(proxy.includes(`"/${route}/:path*"`));
  }
});
