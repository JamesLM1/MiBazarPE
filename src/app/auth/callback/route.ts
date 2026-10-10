import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = request.nextUrl.searchParams.get("next") === "/actualizar-contrasena" ? "/actualizar-contrasena" : "/login?verified=1";
  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
}
