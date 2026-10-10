import assert from "node:assert/strict";
import test from "node:test";
import { validateAuthFields } from "../src/features/auth/validation.ts";
import { authErrorMessage } from "../src/features/auth/errors.ts";

const valid = { name: "Ana Pérez", email: "ana@example.com", password: "UnaClaveLarga24!", confirmation: "UnaClaveLarga24!" };

test("registro valida nombre, correo, longitud y confirmación", () => {
  assert.deepEqual(validateAuthFields("register", valid), {});
  const invalid = validateAuthFields("register", { name: " ", email: "correo@", password: "corta", confirmation: "otra" });
  assert.deepEqual(Object.keys(invalid).sort(), ["confirmation", "email", "name", "password"]);
});

test("login no impone la política de claves nuevas a cuentas existentes", () => {
  assert.deepEqual(validateAuthFields("login", { ...valid, name: "", password: "anterior", confirmation: "" }), {});
  assert.ok(validateAuthFields("login", { ...valid, password: "" }).password);
});

test("recuperación solo exige correo; cambio solo exige contraseña y confirmación", () => {
  assert.deepEqual(validateAuthFields("recover", { ...valid, name: "", password: "", confirmation: "" }), {});
  assert.deepEqual(validateAuthFields("reset", { ...valid, name: "", email: "" }), {});
  assert.ok(validateAuthFields("reset", { ...valid, confirmation: "" }).confirmation);
});

test("acepta espacios exteriores del correo, pero no altera contraseñas", () => {
  assert.deepEqual(validateAuthFields("register", { ...valid, email: " ana@example.com " }), {});
  assert.ok(validateAuthFields("register", { ...valid, password: valid.password + " " }).confirmation);
  assert.ok(validateAuthFields("register", { ...valid, password: "a".repeat(129) }).password);
  assert.ok(validateAuthFields("register", { ...valid, name: "a".repeat(151) }).name);
});

test("errores reales se traducen sin exponer mensajes técnicos ni enumerar cuentas", () => {
  assert.match(authErrorMessage({ code: "invalid_credentials" }), /correo o la contraseña/);
  assert.match(authErrorMessage({ code: "email_not_confirmed" }), /Confirma tu correo/);
  assert.match(authErrorMessage({ code: "user_already_exists" }), /ya está registrado/);
  assert.match(authErrorMessage({ status: 429 }), /demasiados intentos/);
  assert.match(authErrorMessage(new TypeError("fetch failed")), /conectar/);
  assert.match(authErrorMessage({ name: "AuthRetryableFetchError" }), /conexión/);
  assert.equal(authErrorMessage({ code: "database_failure", message: "private database detail" }), "No pudimos completar la solicitud. Inténtalo más tarde.");
  assert.equal(authErrorMessage(null), authErrorMessage("raw server error"));
});
