import { createClient } from "@/lib/supabase/server";

/**
 * Mesmo texto do default da coluna `message_template`
 * (`birthday_message_settings`, Fase 15.1) — duplicado aqui para escolas
 * que ainda não têm nenhuma linha na tabela (nunca configuraram), mesmo
 * padrão de `getMedalPointRules` preenchendo default em memória quando
 * falta linha no banco.
 */
export const DEFAULT_MESSAGE_TEMPLATE = `Olá {Nome}!

Hoje é um dia muito especial!

Toda nossa equipe deseja um feliz aniversário!

Que sua caminhada no Jiu-Jitsu continue sendo cheia de conquistas!

Parabéns!

Equipe Nexus Dojo.`;

export type BirthdayMessageSettings = {
  notifyStudents: boolean;
  notifyTeachers: boolean;
  enabled: boolean;
  messageTemplate: string;
};

export async function getBirthdayMessageSettings(
  schoolId: string,
): Promise<BirthdayMessageSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("birthday_message_settings")
    .select("notify_students, notify_teachers, enabled, message_template")
    .eq("school_id", schoolId)
    .maybeSingle();

  return {
    notifyStudents: data?.notify_students ?? true,
    notifyTeachers: data?.notify_teachers ?? true,
    enabled: data?.enabled ?? false,
    messageTemplate: data?.message_template ?? DEFAULT_MESSAGE_TEMPLATE,
  };
}
