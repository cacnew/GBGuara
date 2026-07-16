import { createClient } from "@/lib/supabase/server";
import { PRESENT_STATUSES } from "@/lib/attendance/constants";

export type OverdueListItem = {
  studentId: string;
  studentName: string;
  amount: number;
  daysOverdue: number;
};

export type AbsentStudent = {
  studentId: string;
  studentName: string;
  lastAttendance: string | null;
};

export type RecentAttendance = {
  id: string;
  studentName: string;
  className: string;
  date: string;
};

export type RecentGraduation = {
  id: string;
  studentName: string;
  beltName: string;
  degree: number;
  date: string;
};

export type TodaysClass = {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  modalityName: string | null;
  teacherName: string | null;
};

export type RecentPayment = {
  id: string;
  studentName: string;
  amount: number;
  date: string;
};

export type BirthdayStudent = {
  id: string;
  name: string;
  phone: string | null;
  birthDate: string;
  birthDay: number;
};

export type AdminDashboardData = {
  activeStudents: number;
  overdueStudentsCount: number;
  activeTeachers: number;
  activeClassGroups: number;
  expectedRevenueMonth: number;
  receivedRevenueMonth: number;
  overdueAmount: number;
  attendancesMonth: number;
  upcomingDueCount: number;
  absentStudentsCount: number;
  overdueList: OverdueListItem[];
  absentStudents: AbsentStudent[];
  recentAttendances: RecentAttendance[];
  recentGraduations: RecentGraduation[];
  todaysClasses: TodaysClass[];
  recentPayments: RecentPayment[];
  birthdayStudents: BirthdayStudent[];
};

function monthBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { start: monthStart, end: monthEnd } = monthBounds();
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    { count: activeStudents },
    { count: activeTeachers },
    { count: activeClassGroups },
    { data: expectedInstallments },
    { data: incomeMovements },
    { data: refundMovements },
    { count: attendancesMonth },
    { count: upcomingDueCount },
    { count: overdueStudentsCount },
    { data: overdueRows },
    { data: allActiveStudents },
    { data: presentAttendances },
    { data: recentAttendanceRows },
    { data: recentGraduationRows },
    { data: todaysClassRows },
    { data: recentPaymentRows },
    { data: birthdayRows },
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("teachers").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("class_groups")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("contract_installments")
      .select("amount")
      .gte("reference_month", monthStart)
      .lt("reference_month", monthEnd)
      .neq("status", "canceled"),
    supabase
      .from("financial_movements")
      .select("amount")
      .eq("type", "income")
      .gte("movement_date", monthStart)
      .lt("movement_date", monthEnd),
    supabase
      .from("financial_movements")
      .select("amount")
      .eq("type", "refund")
      .gte("movement_date", monthStart)
      .lt("movement_date", monthEnd),
    supabase
      .from("attendances")
      .select("id, class_sessions!inner(date)", { count: "exact", head: true })
      .in("status", PRESENT_STATUSES)
      .gte("class_sessions.date", monthStart)
      .lt("class_sessions.date", monthEnd),
    supabase
      .from("contract_installments")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "partially_paid"])
      .gte("due_date", today)
      .lte("due_date", sevenDaysAhead),
    supabase.from("overdue_students").select("student_id", { count: "exact", head: true }),
    supabase
      .from("overdue_students")
      .select("student_id, overdue_amount, oldest_overdue_due_date")
      .order("overdue_amount", { ascending: false })
      .limit(5),
    supabase
      .from("students")
      .select("id, name, enrollment_date")
      .eq("status", "ativo"),
    supabase
      .from("attendances")
      .select("student_id, class_sessions!inner(date)")
      .in("status", PRESENT_STATUSES),
    supabase
      .from("attendances")
      .select("id, student_id, students(name), class_sessions!inner(date, class_groups(name))")
      .in("status", PRESENT_STATUSES)
      .gte("class_sessions.date", thirtyDaysAgo),
    supabase
      .from("graduation_history")
      .select("id, students(name), belts!new_belt_id(name), new_degree, graduation_date")
      .order("graduation_date", { ascending: false })
      .limit(5),
    supabase
      .from("todays_class_groups")
      .select("id, name, start_time, end_time, modalities(name), teachers(name)")
      .order("start_time"),
    supabase
      .from("financial_movements")
      .select("id, amount, movement_date, students(name)")
      .eq("type", "income")
      .order("movement_date", { ascending: false })
      .limit(5),
    supabase
      .from("birthday_students")
      .select("id, name, phone, birth_date, birth_day")
      .order("birth_day")
      .limit(8),
  ]);

  const expectedRevenueMonth = (expectedInstallments ?? []).reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const incomeSum = (incomeMovements ?? []).reduce((sum, row) => sum + row.amount, 0);
  const refundSum = (refundMovements ?? []).reduce((sum, row) => sum + row.amount, 0);
  const receivedRevenueMonth = incomeSum - refundSum;

  const overdueAmount = (overdueRows ?? []).reduce(
    (sum, row) => sum + (row.overdue_amount ?? 0),
    0,
  );

  const studentNameById = new Map((allActiveStudents ?? []).map((s) => [s.id, s.name]));

  const overdueList: OverdueListItem[] = (overdueRows ?? []).map((row) => ({
    studentId: row.student_id ?? "",
    studentName: studentNameById.get(row.student_id ?? "") ?? "-",
    amount: row.overdue_amount ?? 0,
    daysOverdue: row.oldest_overdue_due_date
      ? Math.round(
          (new Date(`${today}T00:00:00Z`).getTime() -
            new Date(`${row.oldest_overdue_due_date}T00:00:00Z`).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0,
  }));

  const lastAttendanceByStudent = new Map<string, string>();
  for (const row of presentAttendances ?? []) {
    const date = row.class_sessions?.date;
    if (!date) continue;
    const existing = lastAttendanceByStudent.get(row.student_id);
    if (!existing || date > existing) {
      lastAttendanceByStudent.set(row.student_id, date);
    }
  }

  const allAbsentStudents: AbsentStudent[] = (allActiveStudents ?? [])
    .map((student) => {
      const lastAttendance = lastAttendanceByStudent.get(student.id) ?? null;
      const referenceDate = lastAttendance ?? student.enrollment_date;
      return { student, lastAttendance, referenceDate };
    })
    .filter((entry) => entry.referenceDate < fifteenDaysAgo)
    .map((entry) => ({
      studentId: entry.student.id,
      studentName: entry.student.name,
      lastAttendance: entry.lastAttendance,
    }));

  const absentStudentsCount = allAbsentStudents.length;
  const absentStudents = allAbsentStudents.slice(0, 5);

  // Ordenação por foreignTable não é confiável combinada com filtro na
  // tabela embutida — ordena no cliente e só então corta as 5 mais recentes.
  const recentAttendances: RecentAttendance[] = (recentAttendanceRows ?? [])
    .slice()
    .sort((a, b) => (b.class_sessions?.date ?? "").localeCompare(a.class_sessions?.date ?? ""))
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      studentName: row.students?.name ?? "-",
      className: row.class_sessions?.class_groups?.name ?? "-",
      date: row.class_sessions?.date ?? "-",
    }));

  const recentGraduations: RecentGraduation[] = (recentGraduationRows ?? []).map((row) => ({
    id: row.id,
    studentName: row.students?.name ?? "-",
    beltName: row.belts?.name ?? "-",
    degree: row.new_degree,
    date: row.graduation_date,
  }));

  const todaysClasses: TodaysClass[] = (todaysClassRows ?? []).map((row) => ({
    id: row.id ?? "",
    name: row.name ?? "-",
    startTime: row.start_time,
    endTime: row.end_time,
    modalityName: row.modalities?.name ?? null,
    teacherName: row.teachers?.name ?? null,
  }));

  const recentPayments: RecentPayment[] = (recentPaymentRows ?? []).map((row) => ({
    id: row.id,
    studentName: row.students?.name ?? "-",
    amount: row.amount,
    date: row.movement_date,
  }));

  const birthdayStudents: BirthdayStudent[] = (birthdayRows ?? [])
    .filter((row) => row.id && row.name && row.birth_date && row.birth_day)
    .map((row) => ({
      id: row.id ?? "",
      name: row.name ?? "-",
      phone: row.phone,
      birthDate: row.birth_date ?? "",
      birthDay: row.birth_day ?? 0,
    }));

  return {
    activeStudents: activeStudents ?? 0,
    overdueStudentsCount: overdueStudentsCount ?? 0,
    activeTeachers: activeTeachers ?? 0,
    activeClassGroups: activeClassGroups ?? 0,
    expectedRevenueMonth,
    receivedRevenueMonth,
    overdueAmount,
    attendancesMonth: attendancesMonth ?? 0,
    upcomingDueCount: upcomingDueCount ?? 0,
    absentStudentsCount,
    overdueList,
    absentStudents,
    recentAttendances,
    recentGraduations,
    todaysClasses,
    recentPayments,
    birthdayStudents,
  };
}
