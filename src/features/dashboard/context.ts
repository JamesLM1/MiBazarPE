import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { Business, PrivateContext } from "./types";

// React cache is request-scoped: no session or tenant data is shared across users.
export const getPrivateContext = cache(async (): Promise<PrivateContext> => {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const [profile, memberships] = await Promise.all([
    supabase.from("perfiles").select("nombre_completo,rol,estado").eq("id", user.id).maybeSingle(),
    supabase.from("usuarios_bazar").select("id_bazar,rol_bazar,bazares(id_bazar,nombre_comercial,estado)").eq("id_usuario", user.id).eq("estado", "ACTIVO").order("created_at"),
  ]);
  const metadataName = user.user_metadata?.nombre_completo ?? user.user_metadata?.full_name;
  const name = profile.data?.nombre_completo || (typeof metadataName === "string" ? metadataName.trim() : "") || user.email?.split("@")[0] || "Mi cuenta";
  const businesses: Business[] = [];
  // A missing/blocked profile cannot open a commercial context. User metadata is display-only.
  if (!memberships.error && !profile.error && profile.data?.estado === "ACTIVO" && profile.data.rol !== "CLIENTE") {
    for (const row of memberships.data ?? []) {
      const related = Array.isArray(row.bazares) ? row.bazares[0] : row.bazares;
      if (related?.estado === "ACTIVO") businesses.push({ id: row.id_bazar, name: related.nombre_comercial, role: row.rol_bazar });
    }
  }
  if (!profile.error && profile.data?.estado === "ACTIVO" && profile.data.rol === "SUPERADMIN") {
    const all = await supabase.from("bazares").select("id_bazar,nombre_comercial").eq("estado","ACTIVO").order("nombre_comercial").limit(200);
    if (!all.error) for (const row of all.data ?? []) {
      if (!businesses.some(item=>item.id===row.id_bazar)) businesses.push({id:row.id_bazar,name:row.nombre_comercial,role:"SUPERADMIN"});
    }
  }
  const selectedId = (await cookies()).get("mibazarpe-business")?.value;
  // The initial picker is bounded; a searched admin selection is checked independently under RLS.
  if(selectedId&&/^[0-9a-f-]{36}$/i.test(selectedId)&&profile.data?.estado==='ACTIVO'&&profile.data.rol==='SUPERADMIN'&&!businesses.some(b=>b.id===selectedId)){
    const selected=await supabase.from('bazares').select('id_bazar,nombre_comercial').eq('id_bazar',selectedId).eq('estado','ACTIVO').maybeSingle();
    if(!selected.error&&selected.data)businesses.push({id:selected.data.id_bazar,name:selected.data.nombre_comercial,role:'SUPERADMIN'});
  }
  const business = businesses.find(item => item.id === selectedId) ?? businesses[0] ?? null;
  const accessPending = profile.error?.code === "42501" || memberships.error?.code === "42501";
  return {
    user: { id: user.id, email: user.email ?? "", name, role: profile.data?.estado === "ACTIVO" ? profile.data.rol : null },
    businesses, business,
    notice: accessPending ? "Tu sesión está activa. El acceso a la información de tu negocio aún está pendiente de habilitación."
      : profile.error || memberships.error ? "No pudimos consultar el acceso a tu negocio. Inténtalo de nuevo más tarde."
      : !business ? "Tu cuenta aún no tiene un bazar accesible. Los indicadores estarán disponibles cuando tu perfil y acceso al negocio estén habilitados." : null,
  };
});
