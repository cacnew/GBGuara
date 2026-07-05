import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { AttendanceClient, type PresentStudent } from "./attendance-client";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await requireUser();
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select("id, date, status, class_groups(name, modalities(name))")
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("id, student_id, students(name)")
    .eq("class_session_id", sessionId);

  const initialPresent: PresentStudent[] = (attendances ?? []).map((a) => ({
    attendanceId: a.id,
    studentId: a.student_id,
    name: a.students?.name ?? "",
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground">
      <div>
        <h1 className="font-heading text-xl font-semibold">
          {session.class_groups?.name ?? "Chamada"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {session.class_groups?.modalities?.name} ·{" "}
          {formatDateOnly(session.date)}
        </p>
      </div>
      <AttendanceClient
        classSessionId={session.id}
        initialPresent={initialPresent}
      />
    </div>
  );
}
