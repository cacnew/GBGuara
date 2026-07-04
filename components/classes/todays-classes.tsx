import { createClient } from "@/lib/supabase/server";
import { OpenSessionButton } from "./open-session-button";

export async function TodaysClasses() {
  const supabase = await createClient();
  const { data: classGroups } = await supabase
    .from("todays_class_groups")
    .select("id, name, start_time, end_time, modalities(name), teachers(name)")
    .order("start_time");

  if (!classGroups?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma turma prevista para hoje.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {classGroups.map((cg) => (
        <div
          key={cg.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
        >
          <div>
            <p className="font-medium">{cg.name}</p>
            <p className="text-muted-foreground">
              {cg.start_time?.slice(0, 5)}–{cg.end_time?.slice(0, 5)} ·{" "}
              {cg.modalities?.name ?? "-"} ·{" "}
              {cg.teachers?.name ?? "sem professor definido"}
            </p>
          </div>
          {/* id nunca é null de fato (é a PK de class_groups) — os
              tipos gerados marcam toda coluna de view como nullable. */}
          <OpenSessionButton classGroupId={cg.id!} />
        </div>
      ))}
    </div>
  );
}
