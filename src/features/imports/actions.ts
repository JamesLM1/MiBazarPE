"use server";

import { revalidatePath } from "next/cache";
import { getPrivateContext } from "@/features/dashboard/context";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";

export type ImportResult = {
  por_crear: number;
  creados: number;
  omitidos: number;
  duplicadas: number[];
  importacion_id?: string;
  repetida: boolean;
};
export type ImportHistoryItem = {
  id_importacion: string;
  tipo: "productos" | "clientes";
  nombre_archivo: string;
  creados: number;
  omitidos: number;
  created_at: string;
};
export type ImportRequest = {
  businessId: string;
  type: "productos" | "clientes";
  rows: Record<string, string | number | null>[];
  key: string;
  fileName: string;
  confirm: boolean;
  consent: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = {
  productos: new Set(["codigo_sku", "nombre", "categoria", "unidad_medida", "precio_contado", "precio_credito", "stock_actual", "stock_minimo", "marca", "descripcion", "proveedor"]),
  clientes: new Set(["nombre_completo", "tipo_documento", "numero_documento", "correo", "telefono", "direccion"]),
};

function validationError(message: string): string {
  const fieldNames: Record<string, string> = {
    estructura: "estructura", columna: "columnas permitidas", codigo_sku: "SKU", nombre: "nombre", categoria: "categoría",
    unidad_medida: "unidad de medida", precio_contado: "precio al contado", precio_credito: "precio a crédito",
    stock_actual: "stock inicial", stock_minimo: "stock mínimo", marca: "marca", descripcion: "descripción", proveedor: "proveedor",
    nombre_completo: "nombre completo", tipo_documento: "tipo de documento", numero_documento: "número de documento", correo: "correo", telefono: "celular", direccion: "dirección",
  };
  const rowError = /IMPORTACION_FILA:(\d+):([a-z_]+)/.exec(message);
  if (rowError) return `Revisa ${fieldNames[rowError[2]] ?? "los datos"} en la fila ${rowError[1]} de la selección. No se guardó ningún registro.`;
  if (message.includes("ACCESO_DENEGADO")) return "Tu cuenta ya no tiene permiso para importar en este negocio. Actualiza la página.";
  if (message.includes("IMPORTACION_CONSENTIMIENTO")) return "Confirma que tienes autorización para registrar los datos de estos clientes.";
  if (message.includes("IMPORTACION_CLAVE_REUTILIZADA")) return "La selección cambió después de guardarse. Carga el archivo de nuevo para empezar otra importación.";
  if (message.includes("IMPORTACION_LIMITE")) return "Importa entre 1 y 500 filas por lote, con un máximo de 500 KB de datos seleccionados.";
  if (message.includes("IMPORTACION_ARCHIVO")) return "Usa un nombre de archivo de hasta 180 caracteres, sin saltos de línea.";
  return "No se pudo completar la importación. Revisa los datos y vuelve a intentarlo; no se guardó un lote parcial.";
}

async function currentBusiness(businessId: string): Promise<boolean> {
  const context = await getPrivateContext();
  return context.business?.id === businessId
    && ["DUENO_BAZAR", "SUPERADMIN"].includes(context.user.role ?? "")
    && (context.business.role === "PROPIETARIO" || context.user.role === "SUPERADMIN");
}

export async function importarCatalog(request: ImportRequest): Promise<{ error: string | null; result?: ImportResult }> {
  // This boundary is callable independently of the UI. The RPC validates again
  // against the live membership, schema and existing records in one transaction.
  if (!request || typeof request !== "object" || !UUID.test(request.businessId ?? "") || !UUID.test(request.key ?? "")
    || !["productos", "clientes"].includes(request.type) || typeof request.confirm !== "boolean" || typeof request.consent !== "boolean"
    || typeof request.fileName !== "string" || !request.fileName.trim() || request.fileName.length > 180
    || !Array.isArray(request.rows) || request.rows.length < 1 || request.rows.length > 500) {
    return { error: "La selección no es válida. Vuelve a cargar el archivo y revisa sus columnas." };
  }
  const allowed = fields[request.type];
  for (const row of request.rows) {
    if (!row || typeof row !== "object" || Array.isArray(row) || Object.entries(row).some(([key, value]) => !allowed.has(key)
      || (value !== null && typeof value !== "string" && typeof value !== "number")
      || (typeof value === "number" && !Number.isFinite(value))
      || (typeof value === "string" && value.length > 250))) {
      return { error: "El archivo contiene campos o valores no admitidos. Revisa la asignación de columnas." };
    }
  }
  const serialized = JSON.stringify(request.rows);
  if (Buffer.byteLength(serialized, "utf8") > 450000) return { error: "Los datos seleccionados son demasiado extensos. Divide el archivo en lotes más pequeños." };
  if (!await currentBusiness(request.businessId)) return { error: "El negocio seleccionado cambió o no tienes permiso para importar. Selecciona tu negocio y vuelve a revisar el archivo." };
  const db = await getSupabaseServerClient();
  const { data, error } = await db.rpc("importar_catalogo", {
    p_bazar: request.businessId, p_tipo: request.type, p_filas: request.rows, p_clave: request.key,
    p_archivo: request.fileName.trim(), p_confirmar: request.confirm, p_consentimiento: request.consent,
  });
  if (error) return { error: validationError(error.message) };
  if (request.confirm) {
    for (const path of ["/importar", "/dashboard", "/inventario", "/clientes", "/ventas", "/compras", "/reportes"]) revalidatePath(path);
  }
  return { error: null, result: data as ImportResult };
}

export async function getImportHistory(businessId: string): Promise<{ items: ImportHistoryItem[]; error: string | null }> {
  if (!UUID.test(businessId ?? "") || !await currentBusiness(businessId)) return { items: [], error: "Selecciona un negocio con permiso para consultar su historial." };
  const db = await getSupabaseServerClient();
  const { data, error } = await db.from("importaciones_catalogo")
    .select("id_importacion,tipo,nombre_archivo,creados,omitidos,created_at")
    .eq("id_bazar", businessId).order("created_at", { ascending: false }).limit(15);
  return error ? { items: [], error: "No se pudo cargar el historial de importaciones." } : { items: (data ?? []) as ImportHistoryItem[], error: null };
}
