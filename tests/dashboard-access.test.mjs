import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, beforeEach, mock, test } from "node:test";

const serverUrl = new URL("../src/infrastructure/supabase/server.ts", import.meta.url).href;
const hooks = registerHooks({ resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
  if (specifier === "@/infrastructure/supabase/server") return { url: serverUrl, shortCircuit: true };
  if (specifier === "next/headers" || specifier === "next/navigation") return next(`${specifier}.js`, context);
  if (["./context", "./model"].includes(specifier)) return next(`${specifier}.ts`, context);
  return next(specifier, context);
} });
let user, authError, profile, membershipResult, selected, productPages, clientResult, queries;
mock.module("next/headers.js", { exports: { cookies: async () => ({ get: () => ({ value: selected }) }) } });
mock.module("next/navigation.js", { exports: { redirect: path => { throw new Error(`REDIRECT:${path}`); } } });
const client = {
  auth: { getUser: async () => ({ data: { user }, error: authError }) },
  from(table) {
    const query = { table, filters: [] }; queries.push(query);
    const builder = {
      select() { return builder; }, eq(key, value) { query.filters.push([key, value]); return builder; },
      order() { return builder; }, gte(key,value) { query.filters.push([key,">=",value]); return builder; }, lte() { return builder; }, limit() { return builder; },
      maybeSingle: async () => profile,
      range: async start => productPages[start / 500] ?? { data: [], error: null },
      then(resolve, reject) { return Promise.resolve(table === "usuarios_bazar" ? membershipResult : table === "clientes" ? clientResult : { data: [], error: null }).then(resolve, reject); },
    };
    return builder;
  },
};
mock.module(serverUrl, { exports: { getSupabaseServerClient: async () => client } });
const { getPrivateContext } = await import("../src/features/dashboard/context.ts");
const { loadDashboard } = await import("../src/features/dashboard/service.ts");
after(() => hooks.deregister());
beforeEach(() => {
  user = { id: "user-test", email: "test@example.invalid", user_metadata: { nombre_completo: "Test", role: "SUPERADMIN" } };
  authError = null; selected = undefined; queries = []; productPages = []; clientResult = { data: [], error: null };
  profile = { data: { nombre_completo: "Test", rol: "DUENO_BAZAR", estado: "ACTIVO" }, error: null };
  membershipResult = { data: [{ id_bazar: "allowed-business", rol_bazar: "PROPIETARIO", bazares: { nombre_comercial: "Test business", estado: "ACTIVO" } }], error: null };
});
test("unauthenticated users redirect before any database query", async () => {
  user = null;
  await assert.rejects(getPrivateContext(), /REDIRECT:\/login/);
  assert.deepEqual(queries, []);
});
test("tenant cookie cannot select a business outside authenticated memberships", async () => {
  selected = "other-business";
  const context = await getPrivateContext();
  assert.equal(context.business.id, "allowed-business");
  assert.equal(context.user.role, "DUENO_BAZAR");
  assert.ok(queries.find(q => q.table === "usuarios_bazar").filters.some(([key, value]) => key === "id_usuario" && value === user.id));
});
test("missing or inactive profiles and client roles cannot read commercial data", async () => {
  for (const record of [null, { rol: "DUENO_BAZAR", estado: "BLOQUEADO" }, { rol: "CLIENTE", estado: "ACTIVO" }]) {
    queries = []; profile = { data: record, error: null };
    const dashboard = await loadDashboard();
    assert.equal(dashboard.hasBusiness, false);
    assert.equal(dashboard.inventory, null);
    assert.ok(!queries.some(query => ["productos", "clientes"].includes(query.table)));
  }
});
test("permission denial shows pending access and never fabricates inventory zeroes", async () => {
  profile = { data: null, error: { code: "42501" } };
  const context = await getPrivateContext();
  assert.equal(context.business, null);
  assert.match(context.notice, /pendiente de habilitación/);
  assert.equal((await loadDashboard()).inventory, null);
});
test("inventory reads all pages under the authorized tenant filter", async () => {
  const make = i => ({ id_producto: String(i), nombre: "Test product", stock_actual: 8, stock_minimo: 5, created_at: "2020-01-01T00:00:00Z" });
  productPages = [{ data: Array.from({ length: 500 }, (_, i) => make(i)), error: null }, { data: [make(500)], error: null }];
  const dashboard = await loadDashboard();
  assert.equal(dashboard.inventory.total, 501);
  assert.equal(dashboard.inventory.normal, 501);
  const dataQueries = queries.filter(query => ["productos", "clientes"].includes(query.table));
  assert.equal(dataQueries.filter(query => query.table === "productos").length, 2);
  assert.ok(dataQueries.every(query => query.filters.some(([key, value]) => key === "id_bazar" && value === "allowed-business")));
});
test("a failed inventory page discards partial totals instead of showing inaccurate KPIs", async () => {
  productPages = [{ data: null, error: { code: "42501" } }];
  const dashboard = await loadDashboard();
  assert.equal(dashboard.inventoryError, true);
  assert.equal(dashboard.inventory, null);
  assert.equal(dashboard.activityError, true);
});

test("latest activity includes historical registrations without changing the tenant or inventory totals", async () => {
  productPages = [{ data: [{ id_producto: "old-product", nombre: "Existing product", stock_actual: 8, stock_minimo: 5, created_at: "2020-01-01T00:00:00Z" }], error: null }];
  clientResult = { data: [{ id_cliente: "old-client", nombre_completo: "Existing client", created_at: "2021-02-03T00:00:00Z" }], error: null };
  const data = await loadDashboard();
  assert.deepEqual(data.activity.map(item => [item.id, item.date]), [["old-client", "2021-02-03T00:00:00Z"], ["old-product", "2020-01-01T00:00:00Z"]]);
  assert.equal(data.inventory.total, 1);
  const clients = queries.find(query => query.table === "clientes");
  assert.ok(clients.filters.some(([key, value]) => key === "id_bazar" && value === "allowed-business"));
  assert.ok(!clients.filters.some(([key, operator]) => key === "created_at" && operator === ">="));
});
