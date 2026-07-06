import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { buttonVariants } from "@/components/ui/button";
import { UserAccessForm } from "./user-access-form";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  teacher: "Professor",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export default async function UsersPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, role, status, created_at")
    .eq("school_id", profile.schoolId)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h1 className="font-heading text-2xl font-bold">Usuarios e permissoes</h1>
          <p className="text-sm text-muted-foreground">
            Professores usam o acesso pratico da chamada. Em situacoes especiais,
            uma conta pode ser promovida para admin.
          </p>
        </div>
        <Link href="/users/new" className={buttonVariants()}>
          Novo usuario
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-card text-left">
            <tr>
              <th className="p-3 font-bold">Usuario</th>
              <th className="p-3 font-bold">Papel atual</th>
              <th className="p-3 font-bold">Status</th>
              <th className="p-3 font-bold">Criado em</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="p-3">
                  <p className="font-bold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="p-3">{ROLE_LABEL[user.role] ?? user.role}</td>
                <td className="p-3">{STATUS_LABEL[user.status] ?? user.status}</td>
                <td className="p-3 text-muted-foreground">
                  {formatDateOnly(user.created_at.slice(0, 10))}
                </td>
                <td className="p-3">
                  <UserAccessForm
                    userId={user.id}
                    currentUserId={profile.id}
                    defaultRole={user.role as "admin" | "teacher"}
                    defaultStatus={user.status as "active" | "inactive"}
                  />
                </td>
              </tr>
            ))}
            {!users?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhum usuario encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
