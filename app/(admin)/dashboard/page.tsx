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
      <Link href="/teachers/new" className={buttonVariants({ className: "w-fit" })}>
        Cadastrar professor
      </Link>
    </div>
  );
}
