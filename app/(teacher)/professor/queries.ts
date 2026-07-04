import { createClient } from "@/lib/supabase/server";

export type RecentSession = { id: string; className: string; date: string };
export type RecentStudent = { id: string; name: string; enrollmentDate: string };
export type RecentNote = { id: string; studentName: string; note: string; date: string };

export type TeacherDashboardData = {
  recentSessions: RecentSession[];
  recentStudents: RecentStudent[];
  recentNotes: RecentNote[];
};

export async function getTeacherDashboardData(email: string): Promise<TeacherDashboardData> {
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let recentSessions: RecentSession[] = [];
  let recentNotes: RecentNote[] = [];

  if (teacher) {
    const { data: sessionRows } = await supabase
      .from("class_sessions")
      .select("id, date, class_groups(name)")
      .eq("actual_teacher_id", teacher.id)
      .order("date", { ascending: false })
      .limit(5);

    recentSessions = (sessionRows ?? []).map((row) => ({
      id: row.id,
      className: row.class_groups?.name ?? "-",
      date: row.date,
    }));

    const { data: noteRows } = await supabase
      .from("attendances")
      .select("id, student_notes, created_at, students(name), class_sessions!inner(actual_teacher_id)")
      .eq("class_sessions.actual_teacher_id", teacher.id)
      .not("student_notes", "is", null)
      .order("created_at", { ascending: false })
      .limit(5);

    recentNotes = (noteRows ?? []).map((row) => ({
      id: row.id,
      studentName: row.students?.name ?? "-",
      note: row.student_notes ?? "",
      date: row.created_at.slice(0, 10),
    }));
  }

  const { data: studentRows } = await supabase
    .from("students")
    .select("id, name, enrollment_date")
    .eq("status", "ativo")
    .order("enrollment_date", { ascending: false })
    .limit(5);

  const recentStudents: RecentStudent[] = (studentRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    enrollmentDate: row.enrollment_date,
  }));

  return { recentSessions, recentStudents, recentNotes };
}
