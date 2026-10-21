export type ContactMessage = { firstName: string; lastName: string; email: string; phone: string; subject: string; message: string };
export type PublicSubmission = ContactMessage & { consent: boolean; captchaToken: string; website: string };
export const POLICY_VERSION = "2026-10-19";
const limits = { firstName: 100, lastName: 100, email: 254, phone: 30, subject: 160, message: 3000, captchaToken: 6000, website: 200 } as const;

export function validateSubmission(input: unknown, kind: "contact" | "newsletter") {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Revisa los datos del formulario." } as const;
  const source = input as Record<string, unknown>;
  const data = { consent: source.consent === true } as PublicSubmission;
  for (const [key, max] of Object.entries(limits) as [keyof typeof limits, number][]) {
    if (source[key] !== undefined && typeof source[key] !== "string") return { error: "Revisa los datos del formulario." } as const;
    const value = ((source[key] as string | undefined) || "").trim();
    if (value.length > max || /\u0000/.test(value)) return { error: "Uno de los campos supera el tamaño permitido." } as const;
    data[key] = value;
  }
  data.email = data.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || /[\r\n]/.test(data.email)) return { error: "Escribe un correo electrónico válido." } as const;
  if (!data.consent) return { error: "Debes autorizar el tratamiento de tus datos para esta solicitud." } as const;
  if (kind === "contact") {
    if ([data.firstName, data.lastName, data.subject, data.message].some(value => value.length < 2)) return { error: "Completa tu nombre, apellidos, asunto y mensaje." } as const;
    if (data.phone && !/^[+\d\s().-]{6,30}$/.test(data.phone)) return { error: "Revisa el número de teléfono." } as const;
    if ([data.firstName, data.lastName, data.subject].some(value => /[\r\n]/.test(value))) return { error: "Revisa el nombre y el asunto." } as const;
  }
  if (!data.captchaToken) return { error: "Completa la verificación de seguridad." } as const;
  return { data } as const;
}
