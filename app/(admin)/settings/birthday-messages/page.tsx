import { requireRole } from "@/lib/permissions";
import { getBirthdayMessageSettings } from "@/modules/birthday-messages/settings";
import { BirthdayMessagesForm } from "./birthday-messages-form";

export default async function BirthdayMessagesSettingsPage() {
  const profile = await requireRole("admin");
  const settings = await getBirthdayMessageSettings(profile.schoolId);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-lg">
        <h1 className="font-heading text-2xl font-semibold">
          Mensagens Automáticas de Aniversário
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envia automaticamente uma mensagem de felicitação por WhatsApp para
          alunos e/ou professores no dia do aniversário. Desligado até você
          habilitar aqui.
        </p>
      </div>
      <BirthdayMessagesForm settings={settings} />
    </div>
  );
}
