import { BackLink } from "@/components/layout/back-link";
import { UserCreateForm } from "../user-create-form";

export default function NewUserPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-2xl flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Novo usuario</h1>
          <p className="text-sm text-muted-foreground">
            Crie uma conta de professor ou admin para a escola.
          </p>
        </div>
        <BackLink href="/users" />
      </div>

      <div className="w-full max-w-2xl">
        <UserCreateForm />
      </div>
    </div>
  );
}
