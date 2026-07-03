import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewBeltForm } from "./form";

export default async function NewBeltPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: beltSystem } = await supabase
    .from("belt_systems")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!beltSystem) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-semibold">Nova faixa</h1>
        <p className="text-sm text-muted-foreground">
          Sistema: {beltSystem.name}
        </p>
      </div>
      <NewBeltForm beltSystemId={beltSystem.id} />
    </div>
  );
}
