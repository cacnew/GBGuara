import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";
import { ReviewButtons } from "./review-buttons";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
  canceled: "Cancelada",
};

export default async function GraduationSuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const profile = await requireRole("admin");
  const { page: pageParam, status = "pending" } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();

  let query = supabase
    .from("graduation_suggestions")
    .select(
      "id, created_at, status, notes, current_degree, suggested_degree, students(id, name), teachers(name), current_belt:belts!graduation_suggestions_current_belt_id_fkey(name), suggested_belt:belts!graduation_suggestions_suggested_belt_id_fkey(name)",
      { count: "exact" },
    )
    .eq("school_id", profile.schoolId)
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: suggestions, count } = await query.range(...getRange(page));

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Sugestoes de graduacao
          </h1>
          <p className="text-sm text-muted-foreground">
            Indicacoes feitas por professores para avaliacao do admin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["pending", "Pendentes"],
            ["approved", "Aprovadas"],
            ["rejected", "Rejeitadas"],
            ["all", "Todas"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/graduation/suggestions?status=${value}`}
              className={buttonVariants({
                size: "sm",
                variant: status === value ? "default" : "outline",
              })}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Data</th>
              <th className="p-3 font-medium">Aluno</th>
              <th className="p-3 font-medium">Sugestao</th>
              <th className="p-3 font-medium">Professor</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {suggestions?.map((suggestion) => (
              <tr key={suggestion.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap p-3">
                  {formatDateOnly(suggestion.created_at.slice(0, 10))}
                </td>
                <td className="p-3">
                  <Link
                    href={`/students/${suggestion.students?.id}/edit`}
                    className="font-bold hover:underline"
                  >
                    {suggestion.students?.name ?? "-"}
                  </Link>
                  {suggestion.notes && (
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      {suggestion.notes}
                    </p>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  <p>
                    {suggestion.current_belt?.name ?? "Atual"} grau{" "}
                    {suggestion.current_degree ?? 0}
                  </p>
                  <p>
                    {suggestion.suggested_belt?.name ?? "Sugerida"} grau{" "}
                    {suggestion.suggested_degree}
                  </p>
                </td>
                <td className="p-3">{suggestion.teachers?.name ?? "-"}</td>
                <td className="p-3">{STATUS_LABEL[suggestion.status] ?? suggestion.status}</td>
                <td className="p-3">
                  {suggestion.status === "pending" && (
                    <ReviewButtons suggestionId={suggestion.id} />
                  )}
                </td>
              </tr>
            ))}
            {!suggestions?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  Nenhuma sugestao encontrada.
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
        basePath="/graduation/suggestions"
        searchParams={{ status }}
      />
    </div>
  );
}
