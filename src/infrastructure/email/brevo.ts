import "server-only";
import type { ContactMessage } from "@/features/marketing/validation";
import { POLICY_VERSION } from "@/features/marketing/validation";

export class DeliveryError extends Error {
  readonly kind: "configuration" | "provider";
  constructor(kind: "configuration" | "provider") { super(kind); this.kind = kind; }
}

export function deliveryConfigured(kind: "contact" | "newsletter") {
  const common = Boolean(process.env.BREVO_API_KEY && process.env.HCAPTCHA_SECRET_KEY && process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);
  return common && (kind === "contact"
    ? Boolean(process.env.MARKETING_FROM_EMAIL && process.env.MARKETING_CONTACT_EMAIL)
    : Boolean(process.env.BREVO_NEWSLETTER_LIST_ID && process.env.BREVO_DOI_TEMPLATE_ID && process.env.MARKETING_PUBLIC_URL));
}

async function brevo(path: string, body: unknown) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new DeliveryError("configuration");
  let result: Response;
  try {
    result = await fetch(`https://api.brevo.com/v3/${path}`, {
      method: "POST", headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000), cache: "no-store",
    });
  } catch { throw new DeliveryError("provider"); }
  // Provider errors can contain credentials or personal data: never relay or log them.
  if (!result.ok) throw new DeliveryError("provider");
}

export async function sendContact(data: ContactMessage) {
  const receiver = process.env.MARKETING_CONTACT_EMAIL;
  const sender = process.env.MARKETING_FROM_EMAIL;
  if (!receiver || !sender) throw new DeliveryError("configuration");
  await brevo("smtp/email", {
    sender: { name: "MiBazarPE", email: sender }, to: [{ email: receiver, name: "MiBazarPE" }],
    replyTo: { email: data.email, name: `${data.firstName} ${data.lastName}` },
    subject: `Contacto MiBazarPE: ${data.subject}`,
    textContent: `Nombre: ${data.firstName} ${data.lastName}\nCorreo: ${data.email}\nTeléfono: ${data.phone || "No indicado"}\n\n${data.message}\n\nAutorización para responder la consulta: ${POLICY_VERSION}\nFecha de recepción: ${new Date().toISOString()}\nNo incorporar al boletín sin consentimiento separado.`,
    tags: ["mibazarpe-contacto"],
  });
}

export async function requestSubscription(email: string) {
  const list = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
  const template = Number(process.env.BREVO_DOI_TEMPLATE_ID);
  const base = process.env.MARKETING_PUBLIC_URL;
  if (!Number.isSafeInteger(list) || list < 1 || !Number.isSafeInteger(template) || template < 1 || !base) throw new DeliveryError("configuration");
  await brevo("contacts/doubleOptinConfirmation", {
    email, includeListIds: [list], templateId: template,
    redirectionUrl: new URL("/boletin/confirmado", base).toString(),
    attributes: { CONSENT_VERSION: POLICY_VERSION, CONSENT_DATE: new Date().toISOString().slice(0, 10) },
    contactPixelTrackingConsent: false,
  });
}
