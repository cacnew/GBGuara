import Link from "next/link";
import { getCurrentUserProfile } from "@/modules/users/queries";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const profile = await getCurrentUserProfile();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Dashboard do administrador
        </h1>
        <p className="text-muted-foreground">
          Olá, {profile?.name}. Conteúdo completo chega na Fase 7.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/students" className={buttonVariants({ className: "w-fit" })}>
          Alunos
        </Link>
        <Link href="/today" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Turmas do dia
        </Link>
        <Link href="/classes" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Turmas
        </Link>
        <Link
          href="/classes/sessions"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Sessões futuras
        </Link>
        <Link href="/teachers" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Professores
        </Link>
        <Link
          href="/teachers/login/new"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Cadastrar login de professor
        </Link>
        <Link
          href="/modalities"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Modalidades
        </Link>
        <Link
          href="/belts"
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          Faixas
        </Link>
      </div>
    </div>
  );
}
