import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ModalityInput } from "@/lib/validations/modality";
import { EditModalityForm } from "./edit-form";

export default async function EditModalityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: modality } = await supabase
    .from("modalities")
    .select("id, name, slug, icon, status")
    .eq("id", id)
    .single();

  if (!modality) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">
          Editar modalidade
        </h1>
      </div>
      <EditModalityForm
        id={modality.id}
        defaultValues={{
          name: modality.name,
          slug: modality.slug,
          icon: modality.icon ?? "",
          status: modality.status as ModalityInput["status"],
        }}
      />
    </div>
  );
}
