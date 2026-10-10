import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, beforeEach, mock, test } from "node:test";

const clientUrl = new URL("../src/infrastructure/supabase/client.ts", import.meta.url).href;
const configUrl = new URL("../src/infrastructure/supabase/config.ts", import.meta.url).href;
const hooks = registerHooks({ resolve(specifier, context, next) {
  if (specifier === "@/infrastructure/supabase/client") return { url: clientUrl, shortCircuit: true };
  if (specifier === "@/infrastructure/supabase/config") return { url: configUrl, shortCircuit: true };
  return next(specifier, context);
} });
const auth = { signInWithOAuth: mock.fn(async () => ({ error: null })) };
mock.module(clientUrl, { exports: { getSupabaseBrowserClient: () => ({ auth }) } });
mock.module(configUrl, { exports: { getSupabaseConfig: () => ({ url: "https://auth.example.invalid", key: "public-test-key" }) } });
const { getSocialAvailability, signInWithSocialProvider } = await import("../src/features/auth/social.ts");
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
globalThis.window = { location: { origin: "http://localhost:3000" } };
after(() => { hooks.deregister(); globalThis.fetch = originalFetch; if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; });
beforeEach(() => { auth.signInWithOAuth = mock.fn(async () => ({ error: null })); });

test("proveedores deshabilitados no inician OAuth", async () => {
  globalThis.fetch = mock.fn(async () => ({ ok: true, json: async () => ({ external: { google: false, github: false } }) }));
  assert.deepEqual(await getSocialAvailability(), { google: false, github: false });
  for (const provider of ["google", "github"]) await assert.rejects(signInWithSocialProvider(provider), /AUTH_PROVIDER_UNAVAILABLE/);
  assert.equal(auth.signInWithOAuth.mock.callCount(), 0);
  const [url, options] = globalThis.fetch.mock.calls[0].arguments;
  assert.equal(url.href, "https://auth.example.invalid/auth/v1/settings");
  assert.deepEqual(options.headers, { apikey: "public-test-key" });
});
test("Google y GitHub habilitados usan exclusivamente el callback local existente", async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ external: { google: true, github: true } }) });
  for (const provider of ["google", "github"]) await signInWithSocialProvider(provider);
  assert.deepEqual(auth.signInWithOAuth.mock.calls.map(call => call.arguments[0]), ["google", "github"].map(provider => ({ provider, options: { redirectTo: "http://localhost:3000/auth/callback" } })));
});
test("fallos de consulta, datos incompletos y proveedores ajenos fallan de forma cerrada", async () => {
  globalThis.fetch = async () => ({ ok: false });
  await assert.rejects(signInWithSocialProvider("google"), /AUTH_PROVIDER_SETTINGS_UNAVAILABLE/);
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ external: { google: "true" } }) });
  assert.deepEqual(await getSocialAvailability(), { google: false, github: false });
  await assert.rejects(signInWithSocialProvider("facebook"), /AUTH_PROVIDER_UNSUPPORTED/);
  assert.equal(auth.signInWithOAuth.mock.callCount(), 0);
});
test("los errores OAuth se propagan para mostrarse en el formulario", async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ external: { github: true } }) });
  const failure = new Error("oauth failed");
  auth.signInWithOAuth = async () => ({ error: failure });
  await assert.rejects(signInWithSocialProvider("github"), error => error === failure);
});
