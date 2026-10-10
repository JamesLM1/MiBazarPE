import type { AuthFieldErrors, AuthFields, AuthMode } from "./types";

export function validateAuthFields(mode: AuthMode, fields: AuthFields): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (mode === "register" && (fields.name.trim().length < 2 || fields.name.trim().length > 150)) errors.name = "Escribe tu nombre completo (entre 2 y 150 caracteres).";
  if (mode !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = "Escribe un correo electrónico válido.";
  if (mode !== "recover" && !fields.password) errors.password = "Escribe tu contraseña.";
  if ((mode === "register" || mode === "reset") && fields.password.length < 10) errors.password = "Usa al menos 10 caracteres.";
  if (mode !== "recover" && fields.password.length > 128) errors.password = "La contraseña no debe superar los 128 caracteres.";
  if ((mode === "register" || mode === "reset") && fields.password !== fields.confirmation) errors.confirmation = "Las contraseñas no coinciden.";
  return errors;
}
