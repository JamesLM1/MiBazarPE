import type { BaziCard, BaziProposal, BaziReply, BaziRoutineInput, BaziStoredWorkspace, BaziProposalState } from "./types";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => v && typeof v === "object" && !Array.isArray(v) ? v as Obj : {};
const text = (v: unknown, max = 12000) => typeof v === "string" ? v.slice(0, max) : "";
const list = (v: unknown, n: number) => Array.isArray(v) ? v.slice(0, n) : [];
const id = (v: unknown) => { const key = text(v, 100).replace(/[^\w-]/g, ""); return ["__proto__", "constructor", "prototype"].includes(key) ? "" : key; };
const validUuid = (v: unknown) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v));
export function blankWorkspace(): BaziStoredWorkspace { return { schema: 1, threads: [{ id: "initial", title: "Tu espacio con Bazi", exchanges: [] }], current: "initial", external: false, states: {}, activity: [] }; }
function card(value: unknown): BaziCard {
  const c = obj(value);
  return { id: id(c.id), title: text(c.title, 160), caption: text(c.caption, 320), kind: ["metrics", "table", "chart", "note"].includes(String(c.kind)) ? c.kind as BaziCard["kind"] : "note",
    metrics: list(c.metrics, 10).map(v => ({ label: text(obj(v).label, 100), value: text(obj(v).value, 100) })),
    columns: list(c.columns, 8).map(v => text(v, 100)), rows: list(c.rows, 20).map(v => list(v, 8).map(cell => text(cell, 1200))),
    points: list(c.points, 48).map(v => ({ label: text(obj(v).label, 80), amount: Number.isFinite(Number(obj(v).amount)) ? Number(obj(v).amount) : 0 })),
    links: list(c.links, 5).flatMap(v => { const l = obj(v); const href = text(l.href, 250); return /^\/(?!\/)[\w/?=&%#.-]*$/.test(href) ? [{ label: text(l.label, 120), href }] : []; }) };
}
function proposal(value: unknown): BaziProposal {
  const p = obj(value);
  return { id: id(p.id), title: text(p.title, 180), detail: text(p.detail, 900), token: "", expiresAt: text(p.expiresAt, 40), changes: list(p.changes, 12).map(v => ({ label: text(obj(v).label, 100), before: text(obj(v).before, 500), after: text(obj(v).after, 500) })) };
}
function reply(value: unknown): BaziReply {
  const r = obj(value);
  // Credit schedules remain in the signed proposal; persisted cards show its review summary.
  return { text: text(r.text), source: r.source === "gemini" ? "gemini" : "direct", error: text(r.error, 80) || undefined, cards: list(r.cards, 8).map(card), proposals: list(r.proposals, 3).map(proposal) };
}
export function cleanWorkspace(value: unknown): BaziStoredWorkspace {
  const v = obj(value); const base = blankWorkspace();
  const threads = list(v.threads, 12).flatMap(t => { const item = obj(t); const key = id(item.id); return key ? [{ id: key, title: text(item.title, 100) || "Conversación", exchanges: (Array.isArray(item.exchanges) ? item.exchanges.slice(-20) : []).map(e => { const x = obj(e); return { id: id(x.id), question: text(x.question, 4000), reply: reply(x.reply) }; }) }] : []; });
  if (threads.length) base.threads = threads;
  base.current = base.threads.some(t => t.id === v.current) ? String(v.current) : base.threads[0].id;
  base.external = v.external === true;
  for (const [key, raw] of Object.entries(obj(v.states)).slice(-240)) {
    const s = obj(raw); if (!["pending", "saving", "done", "canceled"].includes(String(s.status))) continue;
    const cleanKey = id(key); if (!cleanKey) continue;
    base.states[cleanKey] = { status: s.status === "saving" ? "pending" : s.status as BaziProposalState["status"], message: text(s.message, 600) || undefined };
  }
  base.activity = list(v.activity, 80).map(raw => { const a = obj(raw); return { id: id(a.id), title: text(a.title, 120), detail: text(a.detail, 1500), time: text(a.time, 50) }; });
  while (new TextEncoder().encode(JSON.stringify(base)).length > 470000) {
    const last = [...base.threads].reverse().find(t => t.exchanges.length); if (!last) break; last.exchanges.shift();
  }
  return base;
}
export function routineInput(value: unknown, isClient: boolean): BaziRoutineInput {
  const v = obj(value); const title = text(v.title, 101).trim(); const time = String(v.time ?? "");
  if (title.length < 3 || title.length > 100) throw new Error("Escribe un título de 3 a 100 caracteres.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Elige una hora válida de Lima.");
  if (!["DIARIA", "SEMANAL"].includes(String(v.frequency)) || !Number.isInteger(v.day) || Number(v.day) < 0 || Number(v.day) > 6) throw new Error("Revisa la frecuencia y el día.");
  if (!(isClient ? ["MI_CUENTA"] : ["STOCK", "VENCIMIENTOS"]).includes(String(v.kind))) throw new Error("Ese tipo de rutina no está disponible para tu cuenta.");
  if (v.id && !validUuid(v.id)) throw new Error("Rutina no válida.");
  return { id: v.id ? String(v.id) : undefined, title, kind: v.kind as BaziRoutineInput["kind"], frequency: v.frequency as BaziRoutineInput["frequency"], day: Number(v.day), time };
}
export function memoryInput(value: unknown) {
  const v = obj(value); const title = text(v.title, 101).trim(), content = text(v.content, 1801).trim();
  if (title.length < 3 || title.length > 100 || content.length < 5 || content.length > 1800) throw new Error("Usa un título de 3 a 100 caracteres y un contenido de 5 a 1800.");
  if (v.id && !validUuid(v.id)) throw new Error("Nota no válida.");
  return { id: v.id ? String(v.id) : undefined, title, content };
}
