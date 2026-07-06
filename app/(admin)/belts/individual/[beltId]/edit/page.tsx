import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { createClient } from "@/lib/supabase/server";
import { EditBeltForm } from "./form";

export default async function EditBeltPage({
  params,
}: {
  params: Promise<{ beltId: string }>;
}) {
  const { beltId } = await params;
  const supabase = await createClient();
  const { data: belt } = await supabase
    .from("belts")
    .select("id, name, color_hex, ordering, max_degrees")
    .eq("id", beltId)
    .single();

  if (!belt) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Editar faixa</h1>
        <BackLink href="/belts" />
      </div>
      <EditBeltForm
        beltId={belt.id}
        defaultValues={{
          name: belt.name,
          colorHex: belt.color_hex ?? "",
          ordering: belt.ordering,
          maxDegrees: belt.max_degrees,
        }}
      />
    </div>
  );
}
