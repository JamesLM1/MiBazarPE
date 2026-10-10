const messages: Record<string, string> = {
  invalid_credentials: "El correo o la contraseña no son correctos. Revisa tus datos e inténtalo de nuevo.",
  email_not_confirmed: "Confirma tu correo electrónico antes de iniciar sesión. Revisa también la carpeta de spam.",
  user_already_exists: "Este correo ya está registrado. Inicia sesión o recupera tu contraseña.",
  email_exists: "Este correo ya está registrado. Inicia sesión o recupera tu contraseña.",
  weak_password: "La contraseña no cumple los requisitos de seguridad. Prueba con una más larga que combine mayúsculas, minúsculas, números y símbolos.",
  same_password: "Elige una contraseña diferente de la actual.",
  validation_failed: "Revisa los datos ingresados e inténtalo de nuevo.",
  email_address_invalid: "Escribe un correo electrónico válido.",
  email_address_not_authorized: "No se pudo enviar el correo a esta dirección. Inténtalo más tarde.",
  signup_disabled: "El registro no está disponible por el momento. Inténtalo más tarde.",
  over_email_send_rate_limit: "Ya se solicitaron varios correos. Espera unos minutos antes de volver a intentarlo.",
  over_request_rate_limit: "Se realizaron demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
  captcha_failed: "No se pudo completar la verificación de seguridad. Vuelve a intentarlo.",
  request_timeout: "La conexión tardó demasiado. Revisa tu conexión y vuelve a intentarlo.",
  otp_expired: "El enlace ya venció o fue utilizado. Solicita uno nuevo.",
  flow_state_not_found: "El enlace no se pudo validar. Ábrelo en el navegador donde lo solicitaste o pide uno nuevo.",
  flow_state_expired: "El enlace ha vencido. Solicita uno nuevo.",
  session_not_found: "Tu sesión venció. Inicia sesión de nuevo.",
  reauthentication_needed: "Por seguridad, inicia sesión de nuevo antes de cambiar tu contraseña.",
  unexpected_failure: "No pudimos completar la solicitud. Inténtalo más tarde.",
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof TypeError) return "No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.";
  if (typeof error === "object" && error !== null) {
    const { code, status, name } = error as { code?: string; status?: number; name?: string };
    if (code && messages[code]) return messages[code];
    if (status === 429) return messages.over_request_rate_limit;
    if (name === "AuthRetryableFetchError") return messages.request_timeout;
  }
  return messages.unexpected_failure;
}
