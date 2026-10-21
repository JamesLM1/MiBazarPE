import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404, headers });
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return new Response(null, { status: 401, headers });
  const product = await db.from("productos").select("imagen_storage_path").eq("id_producto", id).maybeSingle();
  if (product.error || !product.data?.imagen_storage_path) return new Response(null, { status: 404, headers });
  // Storage RLS checks active owner/superadmin and the product's actual business.
  const result = await db.storage.from("catalogo-privado").download(product.data.imagen_storage_path);
  if (result.error || !result.data) return new Response(null, { status: 404, headers });
  return new Response(result.data, { headers: { ...headers, "Content-Type": "image/webp", "Content-Security-Policy": "default-src 'none'; sandbox" } });
}
