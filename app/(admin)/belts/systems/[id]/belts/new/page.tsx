import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
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
      <div className="flex w-full max-w-sm items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Nova faixa</h1>
          <p className="text-sm text-muted-foreground">
            Sistema: {beltSystem.name}
          </p>
        </div>
        <BackLink href="/belts" />
      </div>
      <NewBeltForm beltSystemId={beltSystem.id} />
    </div>
  );
}
