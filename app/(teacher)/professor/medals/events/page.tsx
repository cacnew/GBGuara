import Link from "next/link";
import { requireUser } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { MedalEventList } from "@/components/medals/event-list";
import { getMedalEvents } from "@/modules/medals/events";

export default async function TeacherMedalEventsPage() {
  await requireUser();
  const events = await getMedalEvents();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Eventos de medalhas</h1>
        <Link href="/professor/medals/events/new" className={buttonVariants()}>
          Novo evento
        </Link>
      </div>
      <MedalEventList events={events} basePath="/professor/medals/events" />
    </div>
  );
}
