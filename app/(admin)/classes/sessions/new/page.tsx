import { BackLink } from "@/components/layout/back-link";
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
      <div className="flex w-full max-w-sm items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Nova sessao extra
          </h1>
          <p className="text-sm text-muted-foreground">
            Aula avulsa fora da grade fixa (ex: Open Mat).
          </p>
        </div>
        <BackLink href="/classes/sessions" />
      </div>
      <NewExtraSessionForm classGroups={classGroups ?? []} />
    </div>
  );
}
