"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getPrivateContext } from "@/features/dashboard/context";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { AccessState } from "@/features/access/actions";
import { normalizeProductPhoto } from "./product-image";

export async function uploadProductPhoto(_: AccessState, form: FormData): Promise<AccessState> {
  const context = await getPrivateContext();
  if (!context.business || (context.user.role !== "SUPERADMIN" && context.business.role !== "PROPIETARIO")) return { error: "No tienes permiso para editar el catálogo." };
  const id = String(form.get("id") ?? ""), file = form.get("photo");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(file instanceof File)) return { error: "Selecciona un producto y una foto." };
  const db = await getSupabaseServerClient();
  const product = await db.from("productos").select("id_producto,imagen_storage_path").eq("id_bazar", context.business.id).eq("id_producto", id).maybeSingle();
  if (product.error || !product.data) return { error: "No pudimos acceder al producto." };
  let bytes: Buffer;
  try { bytes = await normalizeProductPhoto(file); } catch (error) { return { error: error instanceof Error ? error.message : "Imagen inválida." }; }
  const path = `${context.business.id}/${id}/${randomUUID()}.webp`;
  const bucket = db.storage.from("catalogo-privado");
  const uploaded = await bucket.upload(path, bytes, { contentType: "image/webp", upsert: false, cacheControl: "0" });
  if (uploaded.error) return { error: "No pudimos subir la foto. Comprueba tu conexión e inténtalo nuevamente." };
  // Compare-and-set prevents concurrent uploads from silently replacing each other.
  let update = db.from("productos").update({ imagen_storage_path: path }).eq("id_bazar", context.business.id).eq("id_producto", id);
  update = product.data.imagen_storage_path ? update.eq("imagen_storage_path", product.data.imagen_storage_path) : update.is("imagen_storage_path", null);
  const saved = await update.select("id_producto").maybeSingle();
  if (saved.error || !saved.data) {
    // A failed/uncertain response may have committed: the cleanup RLS refuses referenced photos.
    await bucket.remove([path]);
    return { error: "No se confirmó el cambio de foto. Actualiza la ficha antes de volver a intentarlo." };
  }
  // Previous photos are retained; replacing a photo never deletes existing files.
  revalidatePath(`/inventario/${id}`);
  return { success: "Fotografía guardada. Solo las cuentas autorizadas de este negocio pueden verla." };
}
