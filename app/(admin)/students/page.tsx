import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  pausado: "Pausado",
  cancelado: "Cancelado",
  inadimplente: "Inadimplente",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("id, name, phone, status", { count: "exact" })
    .order("name");

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: students, count } = await query.range(...getRange(page));

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Alunos</h1>
        <Link href="/students/new" className={buttonVariants()}>
          Novo aluno
        </Link>
      </div>

      <form className="flex gap-2" action="/students">
        <Input
          name="q"
          placeholder="Buscar por nome..."
          defaultValue={q}
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-10 rounded-lg border border-border bg-background px-3.5 text-sm"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Telefone</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {students?.map((student) => (
              <tr key={student.id} className="border-t border-border">
                <td className="p-3">{student.name}</td>
                <td className="p-3 text-muted-foreground">
                  {student.phone ?? "-"}
                </td>
                <td className="p-3">{STATUS_LABEL[student.status]}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/students/${student.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!students?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={4}>
                  Nenhum aluno encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        basePath="/students"
        searchParams={{ q, status }}
      />
    </div>
  );
}
