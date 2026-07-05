import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name, phone, email, photo_url, status")
    .order("name");

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Professores</h1>
        <Link href="/teachers/new" className={buttonVariants()}>
          Novo professor
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium" />
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Contato</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {teachers?.map((teacher) => (
              <tr key={teacher.id} className="border-t border-border">
                <td className="w-12 p-3">
                  {teacher.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={teacher.photo_url}
                      alt={teacher.name}
                      className="size-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                      {teacher.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="p-3">{teacher.name}</td>
                <td className="p-3 text-muted-foreground">
                  {teacher.phone ?? teacher.email ?? "-"}
                </td>
                <td className="p-3">
                  {teacher.status === "active" ? "Ativo" : "Inativo"}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/teachers/${teacher.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!teachers?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhum professor cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
