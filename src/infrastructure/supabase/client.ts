import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

// The SSR helper reuses one browser client and persists the session in cookies.
export function getSupabaseBrowserClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key);
}
