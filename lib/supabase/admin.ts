import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseServerUrl } from "./url";

/**
 * Client com a service_role key — bypassa RLS. Uso exclusivo em código
 * server-side privilegiado (onboarding, criação de login de professor
 * pelo admin, etc.), nunca exposto ao browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    getSupabaseServerUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
