import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { WEEK_DAYS } from "@/lib/validations/class-group";

const DAY_LABEL = Object.fromEntries(
  WEEK_DAYS.map((d) => [Number(d.value), d.label.slice(0, 3)]),
);

export default async function ClassGroupsPage() {
  const supabase = await createClient();
  const { data: classGroups } = await supabase
    .from("class_groups")
    .select(
      "id, name, start_time, end_time, week_days, status, modalities(name), teachers(name)",
    )
    .order("name");

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Turmas</h1>
        <Link href="/classes/new" className={buttonVariants()}>
          Nova turma
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Modalidade</th>
              <th className="p-3 font-medium">Professor</th>
              <th className="p-3 font-medium">Dias</th>
              <th className="p-3 font-medium">Horário</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {classGroups?.map((cg) => (
              <tr key={cg.id} className="border-t border-border">
                <td className="p-3">{cg.name}</td>
                <td className="p-3 text-muted-foreground">
                  {cg.modalities?.name ?? "-"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {cg.teachers?.name ?? "-"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {(cg.week_days ?? [])
                    .map((d: number) => DAY_LABEL[d])
                    .join(", ")}
                </td>
                <td className="p-3 text-muted-foreground">
                  {cg.start_time.slice(0, 5)}–{cg.end_time.slice(0, 5)}
                </td>
                <td className="p-3">
                  {cg.status === "active" ? "Ativa" : "Inativa"}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/classes/${cg.id}/edit`}
                    className="text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!classGroups?.length && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={7}>
                  Nenhuma turma cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
