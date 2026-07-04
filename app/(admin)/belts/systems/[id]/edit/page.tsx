import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BeltSystemInput } from "@/lib/validations/belt";
import { EditBeltSystemForm } from "./form";

export default async function EditBeltSystemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: beltSystem } = await supabase
    .from("belt_systems")
    .select("id, modality_id, name, audience, description")
    .eq("id", id)
    .single();

  if (!beltSystem) notFound();

  const { data: modalities } = await supabase
    .from("modalities")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">
          Editar sistema de faixa
        </h1>
      </div>
      <EditBeltSystemForm
        id={beltSystem.id}
        modalities={modalities ?? []}
        defaultValues={{
          modalityId: beltSystem.modality_id,
          name: beltSystem.name,
          audience: beltSystem.audience as BeltSystemInput["audience"],
          description: beltSystem.description ?? "",
        }}
      />
    </div>
  );
}
