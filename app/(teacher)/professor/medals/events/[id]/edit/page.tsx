import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/layout/back-link";
import { MedalEventForm } from "@/components/medals/event-form";
import { getMedalEvent } from "@/modules/medals/events";

export default async function EditTeacherMedalEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireUser();
  const { id } = await params;
  const event = await getMedalEvent(id);
  if (!event) notFound();

  const supabase = await createClient();
  const [{ data: modalities }, { count: medalsCount }] = await Promise.all([
    supabase.from("modalities").select("id, name").eq("school_id", profile.schoolId).order("name"),
    supabase.from("medals").select("id", { count: "exact", head: true }).eq("event_id", id),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Editar evento</h1>
        <BackLink href="/professor/medals/events" />
      </div>
      <MedalEventForm
        id={id}
        basePath="/professor/medals/events"
        modalities={modalities ?? []}
        hasMedals={Boolean(medalsCount && medalsCount > 0)}
        defaultValues={{
          name: event.name,
          organization: event.organization ?? "",
          eventDate: event.eventDate,
          modalityId: event.modalityId ?? "",
          status: event.status,
          pointsOuro: event.pointOverrides.ouro?.toString() ?? "",
          pointsPrata: event.pointOverrides.prata?.toString() ?? "",
          pointsBronze: event.pointOverrides.bronze?.toString() ?? "",
          pointsParticipacao: event.pointOverrides.participacao?.toString() ?? "",
        }}
      />
    </div>
  );
}
