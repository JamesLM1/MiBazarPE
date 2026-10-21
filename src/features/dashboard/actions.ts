"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrivateContext } from "./context";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function selectBusiness(form: FormData) {
  const context = await getPrivateContext();
  const id = form.get("business");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;
  if (!context.businesses.some(item => item.id === id)) {
    if(context.user.role!=='SUPERADMIN')return;
    const db=await getSupabaseServerClient();const row=await db.from('bazares').select('id_bazar').eq('id_bazar',id).eq('estado','ACTIVO').maybeSingle();
    if(row.error||!row.data)return;
  }
  (await cookies()).set("mibazarpe-business", id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  redirect("/dashboard");
}
