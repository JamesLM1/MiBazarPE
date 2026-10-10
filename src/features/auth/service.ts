import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import type { AuthFields, AuthMode } from "./types";

// Presentation state only: protected data must still be authorized server-side/RLS.
export function subscribeToAuthChanges(onChange: (authenticated: boolean) => void) {
  const { data: { subscription } } = getSupabaseBrowserClient().auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "PASSWORD_RECOVERY") {
      onChange(Boolean(session));
    }
  });
  return () => subscription.unsubscribe();
}

export async function submitAuth(mode: AuthMode, fields: AuthFields, captchaToken?: string) {
  const supabase = getSupabaseBrowserClient();
  const email = fields.email.trim();
  const callback = new URL("/auth/callback", window.location.origin);
  if (mode === "login") {
    const { error } = await supabase.auth.signInWithPassword({ email, password: fields.password, options: { captchaToken } });
    if (error) throw error;
    return { authenticated: true, message: "Sesión iniciada correctamente." };
  }
  if (mode === "register") {
    const { data, error } = await supabase.auth.signUp({ email, password: fields.password, options: {
      captchaToken,
      emailRedirectTo: callback.toString(),
      // Identity metadata only. Never used as a role or authorization claim.
      data: { nombre_completo: fields.name.trim() },
    } });
    if (error) throw error;
    // Supabase may deliberately obscure duplicate accounts when confirmation is enabled.
    if (data.user?.identities?.length === 0) return { authenticated: false, message: "Revisa tu correo para continuar. Si ya tienes una cuenta, inicia sesión o recupera tu contraseña." };
    return { authenticated: Boolean(data.session), message: data.session ? "Tu cuenta se creó correctamente. Ya has iniciado sesión." : "Revisa tu correo y abre el enlace de confirmación para activar tu cuenta. Revisa también la carpeta de spam." };
  }
  if (mode === "recover") {
    callback.searchParams.set("next", "/actualizar-contrasena");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback.toString(), captchaToken });
    if (error) throw error;
    return { authenticated: false, message: "Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña. Revisa también la carpeta de spam." };
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw userError || { code: "session_not_found" };
  const { error } = await supabase.auth.updateUser({ password: fields.password });
  if (error) throw error;
  return { authenticated: true, message: "Tu contraseña se actualizó correctamente." };
}

export async function signOut() {
  const { error } = await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
  if (error) throw error;
}
