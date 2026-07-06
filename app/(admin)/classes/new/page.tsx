import { BackLink } from "@/components/layout/back-link";
import { createClient } from "@/lib/supabase/server";
import { ClassGroupForm } from "../class-group-form";

export default async function NewClassGroupPage() {
  const supabase = await createClient();
  const { data: modalities } = await supabase
    .from("modalities")
    .select("id, name")
    .eq("status", "active")
    .order("name");
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Nova turma</h1>
        <BackLink href="/classes" />
      </div>
      <ClassGroupForm modalities={modalities ?? []} teachers={teachers ?? []} />
    </div>
  );
}
