import { createClient } from "@/lib/supabase/server";
import { NewBeltSystemForm } from "./form";

export default async function NewBeltSystemPage() {
  const supabase = await createClient();
  const { data: modalities } = await supabase
    .from("modalities")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">
          Novo sistema de faixa
        </h1>
      </div>
      <NewBeltSystemForm modalities={modalities ?? []} />
    </div>
  );
}
