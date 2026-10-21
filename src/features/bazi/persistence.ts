import "server-only";
import type { BaziContext } from "./data";
import { blankWorkspace, cleanWorkspace } from "./workspace-model";
import type { BaziResources, BaziRoutineInput } from "./types";

export async function loadWorkspace(auth: BaziContext) {
  if (!auth.businessId) return { state: blankWorkspace(), version: 0 };
  const result = await auth.db.from("bazi_espacios").select("contenido,version").eq("id_usuario", auth.context.user.id).eq("id_bazar", auth.businessId).eq("rol", auth.context.user.role).maybeSingle();
  if (result.error) return { state: blankWorkspace(), version: 0, error: "No pudimos recuperar tu historial. No sobrescribiremos su contenido." };
  return { state: cleanWorkspace(result.data?.contenido), version: result.data?.version ?? 0 };
}
export async function resources(auth: BaziContext): Promise<BaziResources> {
  if (!auth.businessId) return { routines: [], memories: [], runs: [] };
  const [routines, memories] = await Promise.all([
    auth.db.from("bazi_rutinas").select("id,titulo,tipo,frecuencia,dia,hora,activa,archivada,proxima").eq("id_usuario", auth.context.user.id).eq("id_bazar", auth.businessId).eq("rol", auth.context.user.role).order("created_at", { ascending: false }).limit(50),
    auth.canManage ? auth.db.from("bazi_memoria").select("id,titulo,contenido,activo,updated_at").eq("id_bazar", auth.businessId).order("updated_at", { ascending: false }).limit(50) : Promise.resolve({ data: [], error: null }),
  ]);
  if (routines.error || memories.error) throw new Error("No pudimos recuperar las rutinas o la memoria. Inténtalo nuevamente.");
  const ids = (routines.data ?? []).map(r => r.id);
  const runs = ids.length ? await auth.db.from("bazi_ejecuciones").select("id,id_rutina,created_at,estado,resultado").in("id_rutina", ids).order("created_at", { ascending: false }).limit(30) : { data: [], error: null };
  if (runs.error) throw new Error("No pudimos recuperar las últimas ejecuciones.");
  return { routines: (routines.data ?? []).map(r => ({ id: r.id, title: r.titulo, kind: r.tipo, frequency: r.frecuencia, day: r.dia, time: r.hora.slice(0, 5), active: r.activa, archived: r.archivada, next: r.proxima })),
    memories: (memories.data ?? []).map(r => ({ id: r.id, title: r.titulo, content: r.contenido, active: r.activo, updated: r.updated_at })),
    runs: (runs.data ?? []).map(r => ({ id: r.id, routine: r.id_rutina, time: r.created_at, status: r.estado, metrics: Array.isArray(r.resultado?.metrics) ? r.resultado.metrics : [], note: typeof r.resultado?.note === "string" ? r.resultado.note : "" })) };
}
export async function programRoutine(auth: BaziContext, input: BaziRoutineInput) {
  const result = await auth.db.rpc("bazi_programar", { p_id: input.id ?? null, p_bazar: auth.businessId, p_cliente: auth.clientId, p_rol: auth.context.user.role, p_titulo: input.title, p_tipo: input.kind, p_frecuencia: input.frequency, p_dia: input.day, p_hora: input.time });
  if (result.error) throw new Error("No se pudo programar la rutina. Revisa tu acceso y el límite de veinte rutinas por espacio.");
  return String(result.data);
}
export async function approvedMemory(auth: BaziContext, query: string) {
  if (!auth.canManage || !auth.businessId) return [];
  const result = await auth.db.from("bazi_memoria").select("id,titulo,contenido").eq("id_bazar", auth.businessId).eq("activo", true).order("updated_at", { ascending: false }).limit(30);
  if (result.error) throw new Error("La memoria del negocio no está disponible.");
  const words = query.toLocaleLowerCase("es").split(/\W+/).filter(word => word.length > 2);
  return (result.data ?? []).map(row => ({ ...row, score: words.filter(word => `${row.titulo} ${row.contenido}`.toLocaleLowerCase("es").includes(word)).length })).sort((a, b) => b.score - a.score).slice(0, 5).map(({ id, titulo, contenido }) => ({ id, title: titulo, content: contenido }));
}
