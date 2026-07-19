import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/layout/back-link";
import { MedalEventForm } from "@/components/medals/event-form";

export default async function NewMedalEventPage() {
  const profile = await requireUser();
  const supabase = await createClient();
  const { data: modalities } = await supabase
    .from("modalities")
    .select("id, name")
    .eq("school_id", profile.schoolId)
    .order("name");

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Novo evento</h1>
        <BackLink href="/medals/events" />
      </div>
      <MedalEventForm basePath="/medals/events" modalities={modalities ?? []} />
    </div>
  );
}
