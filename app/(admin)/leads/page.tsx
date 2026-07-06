import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";

const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  contatado: "Contatado",
  agendado: "Agendado",
  matriculado: "Matriculado",
  perdido: "Perdido",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("id, name, phone, source, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: leads, count } = await query.range(...getRange(page));

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Leads</h1>
        <Link href="/leads/new" className={buttonVariants()}>
          Novo lead
        </Link>
      </div>

      <form className="flex gap-2" action="/leads">
        <Input
          name="q"
          placeholder="Buscar por nome..."
          defaultValue={q}
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
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
              <th className="p-3 font-medium">Origem</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {leads?.map((lead) => (
              <tr key={lead.id} className="border-t border-border">
                <td className="p-3">{lead.name}</td>
                <td className="p-3 text-muted-foreground">
                  {lead.phone ?? "-"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {lead.source ?? "-"}
                </td>
                <td className="p-3">{STATUS_LABEL[lead.status]}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/leads/${lead.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!leads?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Nenhum lead encontrado.
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
        basePath="/leads"
        searchParams={{ q, status }}
      />
    </div>
  );
}
