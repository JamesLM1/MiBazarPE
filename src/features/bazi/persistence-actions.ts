"use server";
import { unstable_rethrow } from "next/navigation";
import { getBaziContext } from "./data";
import { cleanWorkspace, memoryInput, routineInput } from "./workspace-model";
import { programRoutine, resources } from "./persistence";
import { UUID } from "./model";
import type { BaziResources } from "./types";

async function context(scope: string) {
  const auth = await getBaziContext();
  if (scope !== auth.scope || !auth.businessId) throw new Error("Tu negocio o tu acceso cambió. Actualiza Bazi.");
  return auth;
}
const errorMessage = (error: unknown) => { unstable_rethrow(error); return error instanceof Error ? error.message : "No pudimos completar la operación."; };
export async function saveBaziWorkspace(scope: string, version: number, value: unknown) {
  try {
    const auth = await context(scope);
    if (!Number.isSafeInteger(version) || version < 0 || JSON.stringify(value).length > 900000) throw new Error("El historial supera el tamaño permitido.");
    const result = await auth.db.rpc("bazi_guardar_espacio", { p_bazar: auth.businessId, p_cliente: auth.clientId, p_rol: auth.context.user.role, p_version: version, p_contenido: cleanWorkspace(value) });
    if (result.error) throw new Error("No se pudo guardar el historial. Tu conversación sigue abierta; vuelve a intentar.");
    return result.data?.saved ? { version: Number(result.data.version) } : { conflict: true, error: "Otra pestaña actualizó Bazi. Recarga para recuperar ese historial antes de guardar más cambios." };
  } catch (error) { return { error: errorMessage(error) }; }
}
export async function loadBaziResources(scope: string): Promise<BaziResources> {
  try { return await resources(await context(scope)); }
  catch (error) { return { routines: [], memories: [], runs: [], error: errorMessage(error) }; }
}
export async function saveBaziRoutine(scope: string, value: unknown) {
  try { const auth = await context(scope); const input = routineInput(value, auth.isClient); const id = await programRoutine(auth, input); return { id, success: "Rutina programada. Encontrarás sus resúmenes aquí, a la hora de Lima elegida." }; }
  catch (error) { return { error: errorMessage(error) }; }
}
export async function setBaziRoutineState(scope: string, id: string, operation: string) {
  try {
    const auth = await context(scope);
    if (!UUID.test(id) || !["pause", "archive", "restore", "resume"].includes(operation)) throw new Error("Elige una rutina válida.");
    const row = await auth.db.from("bazi_rutinas").select("id,titulo,tipo,frecuencia,dia,hora").eq("id", id).eq("id_usuario", auth.context.user.id).eq("id_bazar", auth.businessId).eq("rol", auth.context.user.role).maybeSingle();
    if (row.error || !row.data) throw new Error("No encontramos esa rutina dentro de tu acceso.");
    if (operation === "resume") await programRoutine(auth, routineInput({ id, title: row.data.titulo, kind: row.data.tipo, frequency: row.data.frecuencia, day: row.data.dia, time: row.data.hora.slice(0, 5) }, auth.isClient));
    else {
      const result = await auth.db.from("bazi_rutinas").update({ activa: false, ...(operation !== "pause" ? { archivada: operation === "archive" } : {}), updated_at: new Date().toISOString() }).eq("id", id).eq("id_usuario", auth.context.user.id).eq("id_bazar", auth.businessId).eq("rol", auth.context.user.role).select("id").maybeSingle();
      if (result.error || !result.data) throw new Error("No se pudo cambiar el estado de la rutina.");
    }
    return { success: operation === "resume" ? "Rutina reanudada." : operation === "archive" ? "Rutina archivada. Puedes restaurarla desde el filtro de archivadas." : operation === "restore" ? "Rutina restaurada y pausada." : "Rutina pausada." };
  } catch (error) { return { error: errorMessage(error) }; }
}
export async function runBaziRoutine(scope: string, id: string) {
  try {
    const auth = await context(scope); if (!UUID.test(id)) throw new Error("Rutina no válida.");
    const result = await auth.db.rpc("bazi_ejecutar_rutina", { p_id: id });
    if (result.error) throw new Error("No pudimos preparar el resumen. Revisa que la rutina esté disponible.");
    return { success: "Resumen preparado y guardado. Puedes verlo debajo de tus rutinas." };
  } catch (error) { return { error: errorMessage(error) }; }
}
export async function saveBaziMemory(scope: string, value: unknown) {
  try {
    const auth = await context(scope); if (!auth.canManage) throw new Error("Solo puedes editar memoria del negocio cuando tienes permiso de gestión.");
    const input = memoryInput(value);
    const result = input.id
      ? await auth.db.from("bazi_memoria").update({ titulo: input.title, contenido: input.content, activo: true, updated_at: new Date().toISOString() }).eq("id", input.id).eq("id_bazar", auth.businessId).select("id").maybeSingle()
      : await auth.db.from("bazi_memoria").insert({ id_bazar: auth.businessId, id_autor: auth.context.user.id, titulo: input.title, contenido: input.content }).select("id").single();
    if (result.error || !result.data) throw new Error("No se pudo guardar la nota. Revisa tu acceso al negocio.");
    return { id: String(result.data.id), success: "Nota aprobada y guardada. Bazi podrá recuperarla cuando sea relevante." };
  } catch (error) { return { error: errorMessage(error) }; }
}
export async function setBaziMemoryActive(scope: string, id: string, active: boolean) {
  try {
    const auth = await context(scope); if (!auth.canManage || !UUID.test(id) || typeof active !== "boolean") throw new Error("No puedes cambiar esta nota.");
    const result = await auth.db.from("bazi_memoria").update({ activo: active, updated_at: new Date().toISOString() }).eq("id", id).eq("id_bazar", auth.businessId).select("id").maybeSingle();
    if (result.error || !result.data) throw new Error("No se pudo cambiar la nota.");
    return { success: active ? "Nota restaurada." : "Nota archivada; Bazi ya no la usará para responder." };
  } catch (error) { return { error: errorMessage(error) }; }
}
