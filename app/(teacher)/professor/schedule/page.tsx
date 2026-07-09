import Link from "next/link";
import { getCurrentUserProfile } from "@/modules/users/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { buttonVariants } from "@/components/ui/button";

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextOccurrences(weekDays: number[], limitDays = 14) {
  const today = new Date();
  const dates: string[] = [];

  for (let offset = 0; offset < limitDays; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    if (weekDays.includes(date.getDay())) {
      dates.push(toDateOnly(date));
    }
  }

  return dates;
}

export default async function TeacherSchedulePage() {
  const profile = await getCurrentUserProfile();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("email", profile?.email ?? "")
    .maybeSingle();

  if (!teacher) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
        <h1 className="font-heading text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Nenhuma ficha de professor vinculada ao seu email.
        </p>
      </div>
    );
  }

  const { data: classes } = await supabase
    .from("class_groups")
    .select("id, name, week_days, start_time, end_time, modalities(name)")
    .eq("main_teacher_id", teacher.id)
    .eq("status", "active")
    .order("start_time");

  const schedule = (classes ?? [])
    .flatMap((classGroup) =>
      getNextOccurrences(classGroup.week_days ?? []).map((date) => ({
        id: `${classGroup.id}-${date}`,
        classGroupId: classGroup.id,
        date,
        name: classGroup.name,
        modalityName: classGroup.modalities?.name ?? "-",
        startTime: classGroup.start_time.slice(0, 5),
        endTime: classGroup.end_time.slice(0, 5),
      })),
    )
    .sort((a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
    );

  const dates = Array.from(new Set(schedule.map((item) => item.date)));
  const { data: sessions } = dates.length
    ? await supabase
        .from("class_sessions")
        .select("id, class_group_id, date")
        .in("date", dates)
        .eq("actual_teacher_id", teacher.id)
    : { data: [] };

  const sessionByClassDate = new Map(
    (sessions ?? []).map((session) => [
      `${session.class_group_id}-${session.date}`,
      session.id,
    ]),
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted-foreground">
          Proximas aulas vinculadas a sua ficha de professor.
        </p>
      </div>

      <div className="space-y-4">
        {dates.map((date) => (
          <section key={date} className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-heading text-lg font-semibold">
              {formatDateOnly(date)}
            </h2>
            <div className="mt-3 divide-y divide-border">
              {schedule
                .filter((item) => item.date === date)
                .map((item) => {
                  const sessionId = sessionByClassDate.get(
                    `${item.classGroupId}-${item.date}`,
                  );
                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.modalityName} · {item.startTime}-{item.endTime}
                        </p>
                      </div>
                      {sessionId ? (
                        <Link
                          href={`/attendance/${sessionId}`}
                          className={buttonVariants({ size: "sm" })}
                        >
                          Ver chamada
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Aguardando abertura
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}

        {!schedule.length && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhuma turma ativa vinculada a voce.
          </p>
        )}
      </div>
    </div>
  );
}
