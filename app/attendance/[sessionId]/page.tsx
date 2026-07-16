import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AttendanceClient, type PresentStudent } from "./attendance-client";
import { PRESENT_STATUSES } from "@/lib/attendance/constants";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const profile = await requireUser();
  const backHref = profile.role === "admin" ? "/today" : "/professor";
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, date, status, lesson_content, notes, class_groups(name, modalities(name))")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("id, student_id, student_notes, students(name)")
    .eq("class_session_id", sessionId)
    .in("status", PRESENT_STATUSES);

  const initialPresent: PresentStudent[] = (attendances ?? []).map((a) => ({
    attendanceId: a.id,
    studentId: a.student_id,
    name: a.students?.name ?? "",
    note: a.student_notes ?? "",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">
            {session.class_groups?.name ?? "Chamada"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.class_groups?.modalities?.name} ·{" "}
            {formatDateOnly(session.date)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/attendance/${session.id}/roll-call`}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            Chamada com sinalização
          </Link>
          <Link
            href={backHref}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Concluir chamada
          </Link>
        </div>
      </div>
      <AttendanceClient
        classSessionId={session.id}
        initialPresent={initialPresent}
        initialLessonContent={session.lesson_content ?? ""}
        initialSessionNotes={session.notes ?? ""}
      />
    </div>
  );
}
