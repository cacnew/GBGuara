import Link from "next/link";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  pausado: "Pausado",
  cancelado: "Cancelado",
  inadimplente: "Inadimplente",
};

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "inadimplente", label: "Inadimplentes" },
  { value: "pausado", label: "Pausados" },
  { value: "cancelado", label: "Cancelados" },
];

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
    .select(
      "id, name, phone, email, status, photo_url, current_degree, current_contract_id, belts(name)",
      { count: "exact" },
    )
    .order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const [
    { data: students, count },
    { count: activeCount },
    { count: overdueCount },
    { count: pausedCount },
    { count: canceledCount },
  ] = await Promise.all([
    query.range(...getRange(page)),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "ativo"),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("status", "inadimplente"),
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "pausado"),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelado"),
  ]);

  const contractIds = (students ?? [])
    .map((student) => student.current_contract_id)
    .filter((id): id is string => Boolean(id));
  const { data: contracts } = contractIds.length
    ? await supabase.from("contracts").select("id, plans(name)").in("id", contractIds)
    : { data: [] };
  const planNameByContract = new Map(
    (contracts ?? []).map((contract) => [contract.id, contract.plans?.name ?? "-"]),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Gestao de alunos</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount ?? 0} alunos ativos · {count ?? 0} exibidos
          </p>
        </div>
        <Link href="/students/new" className={buttonVariants()}>
          Novo aluno
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Alunos ativos" value={activeCount ?? 0} href="/students?status=ativo" />
        <MetricCard
          label="Inadimplentes"
          value={overdueCount ?? 0}
          variant={(overdueCount ?? 0) > 0 ? "destructive" : "default"}
          href="/students?status=inadimplente"
        />
        <MetricCard label="Pausados" value={pausedCount ?? 0} href="/students?status=pausado" />
        <MetricCard
          label="Cancelados"
          value={canceledCount ?? 0}
          href="/students?status=cancelado"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <form className="flex flex-1 flex-col gap-2 sm:flex-row" action="/students">
          <Input
            name="q"
            placeholder="Buscar por nome ou e-mail..."
            defaultValue={q}
            className="sm:max-w-sm"
          />
          {status && <input type="hidden" name="status" value={status} />}
          <button type="submit" className={buttonVariants({ variant: "outline" })}>
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => (
            <Link
              key={item.value || "all"}
              href={{
                pathname: "/students",
                query: { ...(q ? { q } : {}), ...(item.value ? { status: item.value } : {}) },
              }}
              className={buttonVariants({
                size: "sm",
                variant: (status ?? "") === item.value ? "default" : "outline",
                className: cn("rounded-full"),
              })}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Aluno</th>
              <th className="p-3 font-medium">Faixa</th>
              <th className="p-3 font-medium">Contato</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Plano</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {students?.map((student) => (
              <tr key={student.id} className="border-t border-border align-middle hover:bg-secondary/50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <AvatarInitials name={student.name} src={student.photo_url} />
                    <div>
                      <Link
                        href={`/students/${student.id}/edit`}
                        className="font-bold hover:underline"
                      >
                        {student.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {student.email ?? "Sem e-mail"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {student.belts?.name ? (
                    <BeltWithPreview
                      name={student.belts.name}
                      degree={student.current_degree}
                    />
                  ) : (
                    <span className="text-muted-foreground">Sem faixa</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{student.phone ?? "-"}</td>
                <td className="p-3">
                  <StatusBadge
                    value={student.status}
                    label={STATUS_LABEL[student.status] ?? student.status}
                  />
                </td>
                <td className="p-3 text-muted-foreground">
                  {student.current_contract_id
                    ? planNameByContract.get(student.current_contract_id) ?? "-"
                    : "-"}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/students/${student.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Abrir ficha
                  </Link>
                </td>
              </tr>
            ))}
            {!students?.length && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
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
