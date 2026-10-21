import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, beforeEach, test } from "node:test";

const hooks = registerHooks({ resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (specifier.startsWith("@/")) return { url: new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, shortCircuit: true };
  if (specifier === "./validation") return { url: new URL("../src/features/marketing/validation.ts", import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
} });
const { validateSubmission } = await import("../src/features/marketing/validation.ts");
const { handleMarketing } = await import("../src/features/marketing/handler.ts");
const originalFetch = globalThis.fetch;
const keys = ["BREVO_API_KEY", "HCAPTCHA_SECRET_KEY", "NEXT_PUBLIC_HCAPTCHA_SITE_KEY", "MARKETING_FROM_EMAIL", "MARKETING_CONTACT_EMAIL", "BREVO_NEWSLETTER_LIST_ID", "BREVO_DOI_TEMPLATE_ID", "MARKETING_PUBLIC_URL"];
const originalEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
let calls = [], counter = 0;
const data = () => ({ firstName: "James", lastName: "Lucas", email: `test${counter++}@example.invalid`, subject: "Consulta", message: "Mensaje de prueba", consent: true, captchaToken: "unit-test-only", website: "", phone: "" });
const request = (body, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/contacto", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  calls = [];
  for (const key of keys) process.env[key] = key.includes("_ID") ? "1" : key === "MARKETING_PUBLIC_URL" ? "http://localhost:3000" : "unit-test-only";
  globalThis.fetch = async (url, options) => { calls.push({ url, body: options.body }); return new Response(JSON.stringify(url.includes("hcaptcha") ? { success: true, hostname: "localhost" } : { messageId: "test" }), { status: 200 }); };
});
after(() => { globalThis.fetch = originalFetch; hooks.deregister(); for (const key of keys) { if (originalEnv[key] === undefined) delete process.env[key]; else process.env[key] = originalEnv[key]; } });

test("validación exige consentimiento independiente y no admite inyección de encabezados", () => {
  assert.ok(validateSubmission({ ...data(), consent: false }, "contact").error);
  assert.ok(validateSubmission({ ...data(), subject: "Hola\r\nBcc:bad@example.invalid" }, "contact").error);
  assert.ok(validateSubmission({ ...data(), message: "a".repeat(3001) }, "contact").error);
  assert.ok(validateSubmission({ ...data(), captchaToken: "" }, "contact").error);
  assert.ok(validateSubmission({ ...data(), email: "Test@Example.invalid" }, "newsletter").data.email === "test@example.invalid");
});
test("rechaza origen ajeno, cuerpo excesivo y trampas sin llamar a proveedores", async () => {
  assert.equal((await handleMarketing(request(data(), "https://evil.invalid"), "contact")).status, 403);
  assert.equal((await handleMarketing(request({ ...data(), junk: "a".repeat(21000) }), "contact")).status, 400);
  assert.equal((await handleMarketing(request({ ...data(), website: "bot" }), "contact")).status, 400);
  assert.equal(calls.length, 0);
});
test("no anuncia éxito cuando faltan credenciales", async () => {
  delete process.env.BREVO_API_KEY;
  const response = await handleMarketing(request(data()), "contact");
  assert.equal(response.status, 503); assert.equal((await response.json()).ok, false); assert.equal(calls.length, 0);
});
test("CAPTCHA rechazado no envía correo", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false }));
  assert.equal((await handleMarketing(request(data()), "contact")).status, 400);
});

test("acepta el dominio público configurado aunque Next use una URL interna y valida el hostname del CAPTCHA", async () => {
  process.env.MARKETING_PUBLIC_URL = "http://mibazarpe.localhost:3000";
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: options.body });
    return new Response(JSON.stringify(url.includes("hcaptcha") ? { success: true, hostname: "mibazarpe.localhost" } : {}));
  };
  assert.equal((await handleMarketing(request(data(), "http://mibazarpe.localhost:3000"), "newsletter")).status, 200);
  assert.equal(calls.length, 2);
  assert.equal((await handleMarketing(request(data(), "http://localhost:3000"), "newsletter")).status, 403);
  calls = [];
  globalThis.fetch = async url => {
    calls.push({ url });
    return new Response(JSON.stringify({ success: true, hostname: "other.invalid" }));
  };
  assert.equal((await handleMarketing(request(data(), "http://mibazarpe.localhost:3000"), "newsletter")).status, 400);
  assert.equal(calls.length, 1);
});
test("contacto llega solo al buzón configurado y usa Reply-To del remitente", async () => {
  const payload = data(); const response = await handleMarketing(request(payload), "contact");
  assert.equal(response.status, 200); assert.equal(calls.length, 2);
  const sent = JSON.parse(calls[1].body);
  assert.deepEqual(sent.to, [{ email: process.env.MARKETING_CONTACT_EMAIL, name: "MiBazarPE" }]);
  assert.equal(sent.replyTo.email, payload.email); assert.equal(sent.sender.email, process.env.MARKETING_FROM_EMAIL);
  assert.match(sent.textContent, /No incorporar al boletín/);
});
test("boletín solicita doble confirmación sin suscribir directamente", async () => {
  const response = await handleMarketing(request(data()), "newsletter");
  assert.equal(response.status, 200);
  assert.equal(calls[1].url, "https://api.brevo.com/v3/contacts/doubleOptinConfirmation");
  const body = JSON.parse(calls[1].body); assert.deepEqual(body.includeListIds, [1]); assert.equal(body.contactPixelTrackingConsent, false);
  assert.equal(body.redirectionUrl, "http://localhost:3000/boletin/confirmado");
});
test("errores de Brevo y límites no se convierten en confirmación falsa ni filtran datos", async () => {
  globalThis.fetch = async url => new Response(JSON.stringify(url.includes("hcaptcha") ? { success: true, hostname: "localhost" } : { message: "secret-provider-detail" }), { status: url.includes("hcaptcha") ? 200 : 500 });
  const response = await handleMarketing(request(data()), "contact");
  assert.equal(response.status, 502); assert.doesNotMatch(await response.text(), /secret-provider-detail/);
  for (let i = 0; i < 5; i++) await handleMarketing(request(data()), "contact");
  assert.equal((await handleMarketing(request(data()), "contact")).status, 429);
});
