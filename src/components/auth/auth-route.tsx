import { AuthPage } from "@/components/auth-page";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";
import type { AuthMode } from "@/features/auth/types";

export async function AuthRoute({ mode, notice }: { mode: AuthMode; notice?: string }) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <AuthPage key={mode} mode={mode} authenticated={Boolean(user)} notice={notice} />;
}
