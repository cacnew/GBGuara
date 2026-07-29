import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type HolidayLookup = { name: string; customMessage: string | null } | null;

/**
 * Feriado/recesso sem aula numa data (Fase 16.3) — função comum, sem
 * `requireRole`, reaproveitada tanto pelo lado aluno (`modules/students/
 * agenda.ts`) quanto staff (`modules/classes/sessions.ts`,
 * `components/classes/todays-classes.tsx`); cada chamador já tem seu
 * próprio `supabase` autenticado, e a RLS de `holidays` (Fase 16.1) cobre
 * os dois papéis separadamente.
 */
export async function getHolidayForDate(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  date: string,
): Promise<HolidayLookup> {
  const { data } = await supabase
    .from("holidays")
    .select("name, custom_message")
    .eq("school_id", schoolId)
    .eq("date", date)
    .eq("has_class", false)
    .maybeSingle();

  return data ? { name: data.name, customMessage: data.custom_message } : null;
}
