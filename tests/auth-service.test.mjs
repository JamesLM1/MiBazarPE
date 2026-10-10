import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, beforeEach, mock, test } from "node:test";

// Exercise the application service without creating users or sending email.
const clientUrl = new URL("../src/infrastructure/supabase/client.ts", import.meta.url).href;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/infrastructure/supabase/client") return { url: clientUrl, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
const auth = {};
mock.module(clientUrl, { exports: { getSupabaseBrowserClient: () => ({ auth }) } });
const { signOut, submitAuth, subscribeToAuthChanges } = await import("../src/features/auth/service.ts");
const originalWindow = globalThis.window;
globalThis.window = { location: { origin: "http://localhost:3000" } };
after(() => {
  hooks.deregister();
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

const fields = { name: " Ana Pérez ", email: " ana@example.invalid ", password: "test-only-password", confirmation: "test-only-password" };
beforeEach(() => {
  for (const key of Object.keys(auth)) delete auth[key];
});

test("login transmite correo normalizado, contraseña intacta y captcha; propaga el error", async () => {
  auth.signInWithPassword = mock.fn(async () => ({ error: null }));
  assert.equal((await submitAuth("login", fields, "test-captcha")).authenticated, true);
  assert.deepEqual(auth.signInWithPassword.mock.calls[0].arguments[0], {
    email: "ana@example.invalid", password: fields.password, options: { captchaToken: "test-captcha" },
  });
  const failure = { code: "invalid_credentials" };
  auth.signInWithPassword = async () => ({ error: failure });
  await assert.rejects(submitAuth("login", fields), error => error === failure);
});

test("registro con autoconfirmación conserva sesión y solo envía metadata de presentación", async () => {
  auth.signUp = mock.fn(async () => ({ data: { session: { user: {} }, user: { identities: [{}] } }, error: null }));
  const result = await submitAuth("register", fields, "test-captcha");
  assert.equal(result.authenticated, true);
  assert.deepEqual(auth.signUp.mock.calls[0].arguments[0], {
    email: "ana@example.invalid", password: fields.password,
    options: { captchaToken: "test-captcha", emailRedirectTo: "http://localhost:3000/auth/callback", data: { nombre_completo: "Ana Pérez" } },
  });
});

test("registro pendiente de confirmación y duplicado oculto nunca anuncian sesión iniciada", async () => {
  auth.signUp = async () => ({ data: { session: null, user: { identities: [{}] } }, error: null });
  const pending = await submitAuth("register", fields);
  assert.equal(pending.authenticated, false);
  assert.match(pending.message, /confirmación/);
  auth.signUp = async () => ({ data: { session: null, user: { identities: [] } }, error: null });
  const duplicate = await submitAuth("register", fields);
  assert.equal(duplicate.authenticated, false);
  assert.doesNotMatch(duplicate.message, /creó correctamente/);
});

test("recuperación usa el callback local y no revela si existe el correo", async () => {
  auth.resetPasswordForEmail = mock.fn(async () => ({ error: null }));
  const result = await submitAuth("recover", fields);
  assert.equal(result.authenticated, false);
  assert.match(result.message, /^Si existe una cuenta/);
  const [email, options] = auth.resetPasswordForEmail.mock.calls[0].arguments;
  assert.equal(email, "ana@example.invalid");
  const callback = new URL(options.redirectTo);
  assert.equal(callback.origin, window.location.origin);
  assert.equal(callback.pathname, "/auth/callback");
  assert.equal(callback.searchParams.get("next"), "/actualizar-contrasena");
});

test("cambio de contraseña exige usuario validado antes de actualizar", async () => {
  auth.getUser = async () => ({ data: { user: null }, error: null });
  auth.updateUser = mock.fn(async () => ({ error: null }));
  await assert.rejects(submitAuth("reset", fields), error => error.code === "session_not_found");
  assert.equal(auth.updateUser.mock.callCount(), 0);
  auth.getUser = async () => ({ data: { user: { id: "test-user" } }, error: null });
  assert.equal((await submitAuth("reset", fields)).authenticated, true);
  assert.deepEqual(auth.updateUser.mock.calls[0].arguments[0], { password: fields.password });
});

test("logout conserva el alcance local y propaga fallos", async () => {
  auth.signOut = mock.fn(async () => ({ error: null }));
  await signOut();
  assert.deepEqual(auth.signOut.mock.calls[0].arguments[0], { scope: "local" });
  const failure = { code: "unexpected_failure" };
  auth.signOut = async () => ({ error: failure });
  await assert.rejects(signOut(), error => error === failure);
});

test("los cambios de sesión notifican entrada, recuperación y salida; desmontar cancela el listener", () => {
  let notify;
  const unsubscribe = mock.fn();
  auth.onAuthStateChange = callback => {
    notify = callback;
    return { data: { subscription: { unsubscribe } } };
  };
  const onChange = mock.fn();
  const stop = subscribeToAuthChanges(onChange);
  notify("SIGNED_IN", { user: {} });
  notify("PASSWORD_RECOVERY", { user: {} });
  notify("TOKEN_REFRESHED", { user: {} });
  notify("SIGNED_OUT", null);
  assert.deepEqual(onChange.mock.calls.map(call => call.arguments[0]), [true, true, false]);
  stop();
  assert.equal(unsubscribe.mock.callCount(), 1);
});
