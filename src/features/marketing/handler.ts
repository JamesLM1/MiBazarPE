import "server-only";
import { createHash } from "node:crypto";
import { validateSubmission } from "./validation";
import { deliveryConfigured, sendContact, requestSubscription } from "@/infrastructure/email/brevo";

// Supplementary per-process throttling; hCaptcha is verified server-side for every send.
// Configure an edge rate limit as well before running several server instances.
const attempts = new Map<string, { count: number; until: number }>();
function limited(key: string, now = Date.now()) {
  for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id);
  const item = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (attempts.size >= 10000 && !attempts.has(key)) return true;
  item.count++; attempts.set(key, item);
  return item.count > 5;
}
const reply = (message: string, status: number) => Response.json({ ok: status === 200, message }, { status, headers: { "Cache-Control": "no-store" } });

async function readBody(request: Request) {
  if (!request.body) throw new Error("body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 20000) { await reader.cancel(); throw new Error("size"); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } finally { reader.releaseLock(); }
}

export async function handleMarketing(request: Request, kind: "contact" | "newsletter") {
  const origin = request.headers.get("origin");
  // Next may expose its internal listening URL behind a proxy or a local alias.
  // Trust the explicitly configured public origin, never arbitrary Host headers.
  let publicOrigin = new URL(request.url).origin;
  try { if (process.env.MARKETING_PUBLIC_URL) publicOrigin = new URL(process.env.MARKETING_PUBLIC_URL).origin; }
  catch { return reply("La dirección pública del servicio no está configurada correctamente.", 503); }
  if (!origin || origin !== publicOrigin) return reply("No se pudo verificar el origen de la solicitud.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return reply("Formato no admitido.", 415);
  let input: unknown;
  try { input = await readBody(request); } catch { return reply("La solicitud no es válida o es demasiado grande.", 400); }
  const parsed = validateSubmission(input, kind);
  if (parsed.error) return reply(parsed.error, 400);
  const { data } = parsed;
  if (data.website) return reply("No se pudo procesar la solicitud.", 400);
  if (!deliveryConfigured(kind)) return reply("El servicio de correo todavía no está habilitado. Escríbenos por WhatsApp mientras lo terminamos de configurar.", 503);
  // Forwarded IP is accepted only in production behind the hosting provider's proxy.
  const ip = process.env.NODE_ENV === "production" ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "local";
  const digest = (value: string) => createHash("sha256").update(value).digest("hex");
  if (limited(`${kind}:ip:${digest(ip)}`) || limited(`${kind}:mail:${digest(data.email)}`)) return reply("Hay varias solicitudes recientes. Espera 15 minutos antes de volver a intentarlo.", 429);
  try {
    const check = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.HCAPTCHA_SECRET_KEY!, sitekey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!, response: data.captchaToken }),
      signal: AbortSignal.timeout(10000), cache: "no-store",
    });
    const verification = await check.json() as { success?: boolean; hostname?: string };
    if (!check.ok || verification.success !== true || verification.hostname !== new URL(publicOrigin).hostname) return reply("La verificación de seguridad venció o no es válida. Complétala de nuevo.", 400);
    if (kind === "contact") await sendContact(data); else await requestSubscription(data.email);
    return reply(kind === "contact" ? "Tu mensaje fue aceptado por nuestro servicio de correo. Te responderemos a la dirección indicada." : "Revisa tu correo y confirma la suscripción. También revisa spam. Todavía no recibirás novedades hasta confirmarla.", 200);
  } catch { return reply("No se pudo completar el envío. Inténtalo más tarde o contáctanos por WhatsApp.", 502); }
}
