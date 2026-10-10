import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { getSupabaseConfig } from "@/infrastructure/supabase/config";

export type SocialProvider = "google" | "github";
export type SocialAvailability = Record<SocialProvider, boolean>;

// Public GoTrue settings only; no admin token or OAuth secret in the browser.
export async function getSocialAvailability(signal?: AbortSignal): Promise<SocialAvailability> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(new URL("/auth/v1/settings", url), { headers: { apikey: key }, signal, cache: "no-store" });
  if (!response.ok) throw new Error("AUTH_PROVIDER_SETTINGS_UNAVAILABLE");
  const settings = await response.json();
  return { google: settings.external?.google === true, github: settings.external?.github === true };
}

export async function signInWithSocialProvider(provider: SocialProvider) {
  if (provider !== "google" && provider !== "github") throw new Error("AUTH_PROVIDER_UNSUPPORTED");
  const available = await getSocialAvailability();
  if (!available[provider]) throw new Error("AUTH_PROVIDER_UNAVAILABLE");
  const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
    provider, options: { redirectTo: new URL("/auth/callback", window.location.origin).toString() },
  });
  if (error) throw error;
}
