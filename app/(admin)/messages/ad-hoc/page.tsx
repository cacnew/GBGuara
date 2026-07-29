import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { AdHocMessageForm, type RecipientOption } from "./ad-hoc-message-form";

export default async function AdHocMessagesPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: students }, { data: teachers }, { data: leads }] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, phone, email")
      .eq("status", "ativo")
      .order("name"),
    supabase
      .from("teachers")
      .select("id, name, phone, email")
      .eq("status", "active")
      .order("name"),
    supabase.from("leads").select("id, name, phone, email").order("name"),
  ]);

  const recipients: RecipientOption[] = [
    ...(students ?? []).map((s) => ({
      type: "aluno" as const,
      id: s.id,
      name: s.name,
      phone: s.phone,
      email: s.email,
    })),
    ...(teachers ?? []).map((t) => ({
      type: "professor" as const,
      id: t.id,
      name: t.name,
      phone: t.phone,
      email: t.email,
    })),
    ...(leads ?? []).map((l) => ({
      type: "lead" as const,
      id: l.id,
      name: l.name,
      phone: l.phone,
      email: l.email,
    })),
  ];

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-lg">
        <h1 className="font-heading text-2xl font-semibold">Mensagens Avulsas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie uma mensagem pontual por WhatsApp e/ou e-mail para um telefone
          digitado ou para um aluno, professor ou lead já cadastrado.
        </p>
      </div>
      <AdHocMessageForm recipients={recipients} />
    </div>
  );
}
