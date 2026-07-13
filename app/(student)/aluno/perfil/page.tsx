import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { LogoutButton } from "@/components/layout/logout-button";
import { ChangePasswordForm } from "./change-password-form";

export default async function StudentProfilePage() {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("name, email, phone, current_degree, enrollment_date, belts(name)")
    .eq("id", profile.id)
    .single();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 text-foreground md:p-6">
      <h1 className="font-heading text-2xl font-semibold">Perfil</h1>

      <section className="max-w-sm space-y-2 rounded-lg border border-border bg-card p-4 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Nome</span>
          <span className="font-medium">{student?.name}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">E-mail</span>
          <span className="font-medium">{student?.email ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Telefone</span>
          <span className="font-medium">{student?.phone ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Faixa</span>
          <span className="font-medium">
            {student?.belts?.name ?? "—"}
            {student?.belts?.name ? ` · grau ${student.current_degree}` : ""}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Matrícula desde</span>
          <span className="font-medium">
            {student?.enrollment_date ? formatDateOnly(student.enrollment_date) : "—"}
          </span>
        </div>
      </section>

      <section className="max-w-sm space-y-3">
        <h2 className="font-heading text-lg font-semibold">Alterar senha</h2>
        <ChangePasswordForm />
      </section>

      <section className="max-w-sm">
        <LogoutButton />
      </section>
    </div>
  );
}
