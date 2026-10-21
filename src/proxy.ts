import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/infrastructure/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims();
  const privateRoots = ["/importar", "/demostracion", "/liquidaciones", "/notificaciones", "/admin", "/portal", "/invitaciones", "/dashboard", "/cuentas-por-cobrar", "/cuentas-por-pagar", "/mi-negocio", "/ventas", "/compras", "/inventario", "/clientes", "/creditos", "/pagos", "/caja", "/reportes", "/bazi", "/configuracion", "/perfil"];
  const privateRoute = privateRoots.some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (privateRoute && (error || !data?.claims)) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// The public landing does not depend on an Auth request.
export const config = { matcher: ["/importar/:path*", "/demostracion/:path*", "/liquidaciones/:path*", "/notificaciones/:path*", "/admin/:path*", "/portal/:path*", "/invitaciones/:path*", "/invitacion", "/login", "/registro", "/recuperar-contrasena", "/actualizar-contrasena", "/auth/:path*", "/dashboard/:path*", "/cuentas-por-cobrar/:path*", "/cuentas-por-pagar/:path*", "/mi-negocio/:path*", "/ventas/:path*", "/compras/:path*", "/inventario/:path*", "/clientes/:path*", "/creditos/:path*", "/pagos/:path*", "/caja/:path*", "/reportes/:path*", "/bazi/:path*", "/configuracion/:path*", "/perfil/:path*"] };
