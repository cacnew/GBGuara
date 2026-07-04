import { createClient } from "@/lib/supabase/server";
import { NewExtraSessionForm } from "./form";

export default async function NewExtraSessionPage() {
  const supabase = await createClient();
  const { data: classGroups } = await supabase
    .from("class_groups")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">
          Nova sessão extra
        </h1>
        <p className="text-sm text-muted-foreground">
          Aula avulsa fora da grade fixa (ex: Open Mat).
        </p>
      </div>
      <NewExtraSessionForm classGroups={classGroups ?? []} />
    </div>
  );
}
