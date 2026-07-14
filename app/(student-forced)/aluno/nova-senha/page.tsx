import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/permissions";
import { NovaSenhaClient } from "./nova-senha-client";

export default async function NovaSenhaObrigatoriaPage() {
  const profile = await requireStudent();

  if (!profile.mustChangePassword) {
    redirect("/aluno");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-xl font-semibold">Defina uma nova senha</h1>
          <p className="text-sm text-muted-foreground">
            Sua senha foi redefinida por um administrador. Escolha uma nova
            senha para continuar.
          </p>
        </div>
        <NovaSenhaClient />
      </div>
    </div>
  );
}
