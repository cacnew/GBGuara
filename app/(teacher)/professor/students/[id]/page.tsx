import { notFound } from "next/navigation";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import { BackLink } from "@/components/layout/back-link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SummaryList } from "@/components/dashboard/summary-list";
import { requireUser } from "@/lib/permissions";
import { formatDateOnly } from "@/lib/dates/format";
import { createClient } from "@/lib/supabase/server";
import { GraduationSuggestionForm } from "./graduation-suggestion-form";
import { InternalNotesSection } from "@/components/students/internal-notes-section";
import { getInternalNotes } from "@/modules/students/internal-notes";

function calculateAge(birthDate: string | null) {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthday) age -= 1;
  return age;
}

function daysSince(dateOnly: string) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export default async function TeacherStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, name, birth_date, phone, email, emergency_contact, photo_url, notes, status, enrollment_date, current_belt_id, current_degree, last_graduation_date, belts(name, color_hex, belt_systems(name, modality_id))",
    )
    .eq("id", id)
    .single();

  if (!student) notFound();

  const { data: guardianLinks } = await supabase
    .from("student_guardians")
    .select("is_primary, guardians(name, phone, relationship)")
    .eq("student_id", student.id)
    .order("is_primary", { ascending: false });

  const graduationReferenceDate =
    student.last_graduation_date ?? student.enrollment_date;
  const currentModalityId = student.belts?.belt_systems?.modality_id ?? null;

  const { data: attendanceRows } = await supabase
    .from("attendances")
    .select(
      "id, student_notes, created_at, class_sessions!inner(id, date, lesson_content, class_groups!inner(name, modality_id))",
    )
    .eq("student_id", student.id)
    .eq("status", "presente")
    .order("created_at", { ascending: false })
    .limit(30);

  const lastAttendance = attendanceRows?.[0]?.class_sessions?.date ?? null;
  const graduationAttendanceDates = new Set(
    (attendanceRows ?? [])
      .filter((attendance) => {
        const session = attendance.class_sessions;
        if (!session || session.date < graduationReferenceDate) return false;
        if (!currentModalityId) return true;
        return session.class_groups?.modality_id === currentModalityId;
      })
      .map((attendance) => attendance.class_sessions?.date)
      .filter((date): date is string => Boolean(date)),
  );

  const { data: graduationRows } = await supabase
    .from("graduation_history")
    .select("id, graduation_date, new_degree, belts!new_belt_id(name)")
    .eq("student_id", student.id)
    .order("graduation_date", { ascending: false })
    .limit(5);

  const { data: belts } = await supabase
    .from("belts")
    .select("id, name, ordering, max_degrees, belt_systems(name)")
    .order("ordering");

  const { data: pendingSuggestion } = await supabase
    .from("graduation_suggestions")
    .select("id")
    .eq("student_id", student.id)
    .eq("status", "pending")
    .maybeSingle();

  const internalNotes = await getInternalNotes(student.id);

  const age = calculateAge(student.birth_date);
  const recentNotes = (attendanceRows ?? [])
    .filter((attendance) => Boolean(attendance.student_notes))
    .slice(0, 5);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {student.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.photo_url}
              alt={student.name}
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-full bg-card text-xl font-bold">
              {student.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="font-heading text-2xl font-semibold">{student.name}</h1>
            <p className="text-sm text-muted-foreground">
              {student.belts?.name ?? "Sem faixa"} · grau {student.current_degree}
              {age !== null ? ` · ${age} anos` : ""}
            </p>
            {student.belts?.name && (
              <div className="mt-1 text-sm text-muted-foreground">
                <BeltWithPreview
                  name={student.belts.name}
                  degree={student.current_degree}
                />
              </div>
            )}
          </div>
        </div>
        <BackLink href="/professor" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Presencas recentes"
          value={attendanceRows?.length ?? 0}
        />
        <MetricCard
          label="Dias desde ultima graduacao"
          value={daysSince(graduationReferenceDate)}
        />
        <MetricCard
          label="Dias validos para graduacao"
          value={graduationAttendanceDates.size}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-heading text-lg font-semibold">Resumo</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-muted-foreground">Telefone</dt>
                <dd>{student.phone ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Email</dt>
                <dd>{student.email ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Emergencia</dt>
                <dd>{student.emergency_contact ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Ultima presenca</dt>
                <dd>{lastAttendance ? formatDateOnly(lastAttendance) : "-"}</dd>
              </div>
            </dl>
            {student.notes && (
              <p className="mt-3 rounded-lg bg-background p-3 text-sm text-muted-foreground">
                {student.notes}
              </p>
            )}
          </div>

          <SummaryList
            title="Ultimas presencas"
            emptyMessage="Nenhuma presenca registrada."
            items={(attendanceRows ?? []).slice(0, 8).map((attendance) => ({
              id: attendance.id,
              primary: attendance.class_sessions?.class_groups?.name ?? "Aula",
              secondary: attendance.class_sessions?.lesson_content ?? undefined,
              trailing: attendance.class_sessions?.date
                ? formatDateOnly(attendance.class_sessions.date)
                : undefined,
              href: attendance.class_sessions?.id
                ? `/attendance/${attendance.class_sessions.id}`
                : undefined,
            }))}
          />

          <SummaryList
            title="Observacoes recentes"
            emptyMessage="Nenhuma observacao registrada."
            items={recentNotes.map((attendance) => ({
              id: attendance.id,
              primary: attendance.student_notes ?? "",
              trailing: attendance.class_sessions?.date
                ? formatDateOnly(attendance.class_sessions.date)
                : undefined,
            }))}
          />
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-heading text-lg font-semibold">Responsaveis</h2>
            <div className="mt-3 space-y-2 text-sm">
              {guardianLinks?.map((link, index) => (
                <div key={`${link.guardians?.name}-${index}`}>
                  <p className="font-bold">
                    {link.guardians?.name ?? "-"}
                    {link.is_primary ? " · principal" : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {link.guardians?.relationship ?? "-"} ·{" "}
                    {link.guardians?.phone ?? "-"}
                  </p>
                </div>
              ))}
              {!guardianLinks?.length && (
                <p className="text-muted-foreground">Nenhum responsavel vinculado.</p>
              )}
            </div>
          </div>

          <SummaryList
            title="Historico de graduacao"
            emptyMessage="Nenhuma graduacao registrada."
            items={(graduationRows ?? []).map((graduation) => ({
              id: graduation.id,
              primary: `${graduation.belts?.name ?? "Faixa"} · grau ${graduation.new_degree}`,
              trailing: formatDateOnly(graduation.graduation_date),
            }))}
          />

          <GraduationSuggestionForm
            studentId={student.id}
            belts={(belts ?? []).map((belt) => ({
              id: belt.id,
              name: belt.name,
              systemName: belt.belt_systems?.name ?? "Sistema",
              maxDegrees: belt.max_degrees,
            }))}
            defaultBeltId={student.current_belt_id ?? belts?.[0]?.id ?? ""}
            defaultDegree={student.current_degree}
            hasPendingSuggestion={Boolean(pendingSuggestion)}
          />

          <InternalNotesSection studentId={student.id} notes={internalNotes} />
        </aside>
      </div>
    </div>
  );
}
