import { createClient } from "@/lib/supabase/server";
import { PRESENT_STATUSES } from "@/lib/attendance/constants";
import { getGraduationEligibilityByStudentIds } from "@/modules/graduation/eligibility";

export type RecentSession = { id: string; className: string; date: string };
export type RecentStudent = { id: string; name: string; enrollmentDate: string };
export type RecentNote = { id: string; studentName: string; note: string; date: string };
export type UpcomingClass = {
  id: string;
  className: string;
  modalityName: string;
  date: string;
  startTime: string;
};
export type AttentionStudent = {
  id: string;
  name: string;
  reason: string;
  trailing: string;
};
export type PendingGraduationSuggestion = {
  id: string;
  studentId: string;
  studentName: string;
  suggestedBeltName: string;
  suggestedDegree: number;
  date: string;
};
export type RecentLessonContent = {
  id: string;
  className: string;
  content: string;
  date: string;
};
export type EligibleGraduationStudent = {
  id: string;
  name: string;
  lastGraduationDate: string | null;
  attendancesSinceLastGraduation: number;
};

export type TeacherDashboardData = {
  metrics: {
    classesToday: number;
    upcomingClasses: number;
    pendingGraduationSuggestions: number;
    attentionStudents: number;
    eligibleForGraduation: number;
  };
  upcomingClasses: UpcomingClass[];
  recentSessions: RecentSession[];
  recentStudents: RecentStudent[];
  recentNotes: RecentNote[];
  attentionStudents: AttentionStudent[];
  pendingGraduationSuggestions: PendingGraduationSuggestion[];
  recentLessonContents: RecentLessonContent[];
  eligibleForGraduation: EligibleGraduationStudent[];
};

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

function formatShortDate(dateOnly: string) {
  const [, month, day] = dateOnly.split("-");
  return `${day}/${month}`;
}

export async function getTeacherDashboardData(
  email: string,
  schoolId: string,
): Promise<TeacherDashboardData> {
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let recentSessions: RecentSession[] = [];
  let recentNotes: RecentNote[] = [];
  let upcomingClasses: UpcomingClass[] = [];
  let pendingGraduationSuggestions: PendingGraduationSuggestion[] = [];
  let recentLessonContents: RecentLessonContent[] = [];

  if (teacher) {
    const { data: classRows } = await supabase
      .from("class_groups")
      .select("id, name, week_days, start_time, modalities(name)")
      .eq("main_teacher_id", teacher.id)
      .eq("status", "active")
      .order("start_time");

    upcomingClasses = (classRows ?? [])
      .flatMap((row) =>
        getNextOccurrences(row.week_days ?? []).map((date) => ({
          id: `${row.id}-${date}`,
          className: row.name,
          modalityName: row.modalities?.name ?? "-",
          date,
          startTime: row.start_time.slice(0, 5),
        })),
      )
      .sort((a, b) =>
        `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
      )
      .slice(0, 6);

    const { data: sessionRows } = await supabase
      .from("class_sessions")
      .select("id, date, lesson_content, class_groups(name)")
      .eq("actual_teacher_id", teacher.id)
      .order("date", { ascending: false })
      .limit(5);

    recentSessions = (sessionRows ?? []).map((row) => ({
      id: row.id,
      className: row.class_groups?.name ?? "-",
      date: row.date,
    }));

    recentLessonContents = (sessionRows ?? [])
      .filter((row) => Boolean(row.lesson_content))
      .map((row) => ({
        id: row.id,
        className: row.class_groups?.name ?? "-",
        content: row.lesson_content ?? "",
        date: row.date,
      }));

    const { data: noteRows } = await supabase
      .from("attendances")
      .select("id, student_notes, updated_at, students(name), class_sessions!inner(actual_teacher_id)")
      .eq("class_sessions.actual_teacher_id", teacher.id)
      .not("student_notes", "is", null)
      .order("updated_at", { ascending: false })
      .limit(5);

    // `updated_at` (não `created_at`) reflete quando a observação foi de
    // fato salva — saveAttendanceNote faz um UPDATE na linha, que pode ter
    // sido criada bem antes (ex: sessão registrada, nota adicionada dias
    // depois).
    recentNotes = (noteRows ?? []).map((row) => ({
      id: row.id,
      studentName: row.students?.name ?? "-",
      note: row.student_notes ?? "",
      date: row.updated_at.slice(0, 10),
    }));

    const { data: suggestionRows } = await supabase
      .from("graduation_suggestions")
      .select("id, created_at, suggested_degree, students(id, name), belts!suggested_belt_id(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);

    pendingGraduationSuggestions = (suggestionRows ?? []).map((row) => ({
      id: row.id,
      studentId: row.students?.id ?? "",
      studentName: row.students?.name ?? "-",
      suggestedBeltName: row.belts?.name ?? "-",
      suggestedDegree: row.suggested_degree,
      date: row.created_at.slice(0, 10),
    }));
  }

  const { data: studentRows } = await supabase
    .from("students")
    .select("id, name, enrollment_date, created_at")
    .eq("status", "ativo")
    .order("enrollment_date", { ascending: false })
    .limit(30);

  const recentStudents: RecentStudent[] = (studentRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    enrollmentDate: row.enrollment_date,
  })).slice(0, 5);

  const studentIds = (studentRows ?? []).map((row) => row.id);
  const { data: attendanceRows } = studentIds.length
    ? await supabase
        .from("attendances")
        .select("student_id, class_sessions!inner(date)")
        .in("student_id", studentIds)
        .in("status", PRESENT_STATUSES)
    : { data: [] };

  const lastAttendanceByStudent = new Map<string, string>();
  for (const attendance of attendanceRows ?? []) {
    const date = attendance.class_sessions?.date;
    if (!date) continue;
    const current = lastAttendanceByStudent.get(attendance.student_id);
    if (!current || date > current) {
      lastAttendanceByStudent.set(attendance.student_id, date);
    }
  }

  const today = new Date();
  const attentionStudents: AttentionStudent[] = (studentRows ?? [])
    .map((student) => {
      const lastAttendance = lastAttendanceByStudent.get(student.id);
      const referenceDate = lastAttendance ?? student.enrollment_date;
      const diffDays = Math.floor(
        (today.getTime() - new Date(`${referenceDate}T00:00:00`).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (!lastAttendance && diffDays >= 7) {
        return {
          id: student.id,
          name: student.name,
          reason: "Aluno novo sem presenca registrada",
          trailing: `${diffDays} dias`,
        };
      }

      if (lastAttendance && diffDays >= 15) {
        return {
          id: student.id,
          name: student.name,
          reason: "Ausente ha 15+ dias",
          trailing: formatShortDate(lastAttendance),
        };
      }

      return null;
    })
    .filter((student): student is AttentionStudent => Boolean(student))
    .slice(0, 5);

  const todayOnly = toDateOnly(new Date());
  const classesToday = upcomingClasses.filter((item) => item.date === todayOnly).length;

  // Alunos aptos para graduação (Fase 13.2) — escopo é toda a escola, não
  // só os 30 alunos mais recentes usados acima em `attentionStudents`.
  const { data: activeStudentRows } = await supabase
    .from("students")
    .select("id, name")
    .eq("status", "ativo");

  const eligibilityByStudent = await getGraduationEligibilityByStudentIds(
    schoolId,
    (activeStudentRows ?? []).map((row) => row.id),
  );

  const eligibleForGraduation: EligibleGraduationStudent[] = (activeStudentRows ?? [])
    .map((row) => {
      const eligibility = eligibilityByStudent.get(row.id);
      if (!eligibility?.isEligible) return null;
      return {
        id: row.id,
        name: row.name,
        lastGraduationDate: eligibility.lastGraduationDate,
        attendancesSinceLastGraduation: eligibility.attendancesSinceLastGraduation,
      };
    })
    .filter((student): student is EligibleGraduationStudent => Boolean(student))
    .sort((a, b) => (a.lastGraduationDate ?? "").localeCompare(b.lastGraduationDate ?? ""));

  return {
    metrics: {
      classesToday,
      upcomingClasses: upcomingClasses.length,
      pendingGraduationSuggestions: pendingGraduationSuggestions.length,
      attentionStudents: attentionStudents.length,
      eligibleForGraduation: eligibleForGraduation.length,
    },
    upcomingClasses,
    recentSessions,
    recentStudents,
    recentNotes,
    attentionStudents,
    pendingGraduationSuggestions,
    recentLessonContents,
    eligibleForGraduation,
  };
}
