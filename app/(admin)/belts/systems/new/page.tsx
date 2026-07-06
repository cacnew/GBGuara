import { BackLink } from "@/components/layout/back-link";
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
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">
          Novo sistema de faixa
        </h1>
        <BackLink href="/belts" />
      </div>
      <NewBeltSystemForm modalities={modalities ?? []} />
    </div>
  );
}
