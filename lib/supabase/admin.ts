import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client com a service_role key — bypassa RLS. Uso exclusivo em código
 * server-side privilegiado (onboarding, criação de login de professor
 * pelo admin, etc.), nunca exposto ao browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
