export function getSupabaseServerUrl() {
  return process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

export const SUPABASE_AUTH_COOKIE_NAME = "sb-nexusdojo-auth-token";
