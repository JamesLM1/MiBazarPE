import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const canManageBazi = (role: string | null, membership: string | null) =>
  (role === "DUENO_BAZAR" && membership === "PROPIETARIO") || (role === "SUPERADMIN" && membership !== null);
export function baziScope(user: string, role: string | null, business: string | null) { return `${user}:${role ?? "none"}:${business ?? "portal"}`; }
export function safeQuery(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 80).replace(/[%_\\]/g, "") : "";
}
export function cleanHistory(value: unknown): { role: "user" | "assistant"; text: string }[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).flatMap(item => item && (item.role === "user" || item.role === "assistant") && typeof item.text === "string"
    ? [{ role: item.role, text: item.text.slice(0, 2400) }] : []);
}
export function productChange(field: unknown, raw: unknown, cash: string, credit: string) {
  if (!["precio_contado", "precio_credito", "stock_minimo"].includes(String(field))) throw new Error("Solo puedo proponer precios o stock mínimo de un producto.");
  const value = String(raw ?? "").trim().replace(",", ".");
  if (field === "stock_minimo") {
    if (!/^\d{1,6}$/.test(value) || Number(value) > 100000) throw new Error("El stock mínimo debe estar entre 0 y 100000.");
    return String(Number(value));
  }
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value) || Number(value) <= 0 || Number(value) > 100000) throw new Error("Indica un precio positivo de hasta S/ 100000, con dos decimales como máximo.");
  if ((field === "precio_contado" && Number(value) > Number(credit)) || (field === "precio_credito" && Number(value) < Number(cash))) throw new Error("El precio crédito no puede ser menor al contado. Prepara un cambio compatible.");
  return value;
}

// Ephemeral proposals fail closed after a restart. Configure a stable private key for multiple instances.
const signingKey = process.env.BAZI_ACTION_SECRET || randomBytes(32).toString("hex");
export function signProposal(payload: Record<string, unknown>, key = signingKey, now = Date.now()) {
  const data = Buffer.from(JSON.stringify({ ...payload, expires: now + 10 * 60 * 1000 })).toString("base64url");
  return `${data}.${createHmac("sha256", key).update(data).digest("base64url")}`;
}
export function readProposal(token: string, user: string, business: string, key = signingKey, now = Date.now()): Record<string, unknown> {
  if (typeof token !== "string" || token.length > 24000) throw new Error("Propuesta inválida.");
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[\w-]+$/.test(parts[0]) || !/^[\w-]+$/.test(parts[1])) throw new Error("Propuesta inválida.");
  const expected = createHmac("sha256", key).update(parts[0]).digest();
  const actual = Buffer.from(parts[1], "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("La propuesta no es válida. Prepárala de nuevo.");
  const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  if (!payload || payload.user !== user || payload.business !== business || !Number.isFinite(payload.expires) || payload.expires <= now) throw new Error("La propuesta caducó o pertenece a otro contexto. Prepárala de nuevo.");
  return payload;
}
