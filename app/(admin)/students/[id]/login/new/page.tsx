import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/layout/back-link";
import { CreateStudentLoginForm } from "./form";

export default async function NewStudentLoginPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, name, email, auth_user_id")
    .eq("id", id)
    .eq("school_id", profile.schoolId)
    .single();

  if (!student) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">
            Criar login de aluno
          </h1>
          <p className="text-sm text-muted-foreground">
            Cria o acesso de <strong>{student.name}</strong> ao módulo do
            aluno.
          </p>
        </div>
        <BackLink href={`/students/${student.id}/edit`} />
      </div>

      {student.auth_user_id ? (
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Este aluno já possui login criado.
        </div>
      ) : (
        <CreateStudentLoginForm
          studentId={student.id}
          defaultEmail={student.email ?? ""}
        />
      )}
    </div>
  );
}
