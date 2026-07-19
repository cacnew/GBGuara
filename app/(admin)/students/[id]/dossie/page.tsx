import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/layout/back-link";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import { StatusBadge } from "@/components/ui/status-badge";
import { InternalNotesSection } from "@/components/students/internal-notes-section";
import { MedalsSection } from "@/components/students/medals-section";
import { formatDateOnly } from "@/lib/dates/format";
import { getStudentFinancialSummary } from "../edit/financial-queries";
import { AttendanceHistory } from "../edit/attendance-history";
import { getInternalNotes } from "@/modules/students/internal-notes";
import { getApprovedMedalsForStudent } from "@/modules/medals/history";
import { getStaffMedalLaunchFormData } from "@/modules/medals/staff-launch";

const SITUACAO_LABEL: Record<string, string> = {
  sem_contrato: "Sem contrato",
  isento: "Isento",
  inadimplente: "Inadimplente",
  pausado: "Pausado",
  encerrado: "Encerrado",
  regular: "Regular",
};

const STUDENT_STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  pausado: "Pausado",
  cancelado: "Cancelado",
  inadimplente: "Inadimplente",
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function StudentDossiePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole("admin");
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, name, birth_date, cpf, phone, email, address, emergency_contact, photo_url, status, enrollment_date, current_degree, belts(name)",
    )
    .eq("id", id)
    .single();

  if (!student) notFound();

  const { data: guardianLinks } = await supabase
    .from("student_guardians")
    .select("is_primary, is_financial_responsible, guardians(name, phone, relationship)")
    .eq("student_id", id)
    .order("is_primary", { ascending: false });

  const { data: graduationHistoryRows } = await supabase
    .from("graduation_history")
    .select("id, graduation_date, new_degree, new_belt:belts!graduation_history_new_belt_id_fkey(name)")
    .eq("student_id", id)
    .order("graduation_date", { ascending: false });

  const financialSummary = await getStudentFinancialSummary(id);
  const notes = await getInternalNotes(id);
  const medals = await getApprovedMedalsForStudent(id, profile.schoolId);
  const medalFormData = await getStaffMedalLaunchFormData();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Dossiê do aluno</h1>
        <BackLink href={`/students/${id}/edit`} />
      </div>

      <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <section className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <AvatarInitials name={student.name} src={student.photo_url} className="size-16" />
            <div>
              <h2 className="font-heading text-lg font-semibold">{student.name}</h2>
              <StatusBadge
                value={student.status}
                label={STUDENT_STATUS_LABEL[student.status] ?? student.status}
              />
              {student.belts?.name && (
                <div className="mt-1">
                  <BeltWithPreview name={student.belts.name} degree={student.current_degree} />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="font-heading text-lg font-semibold">Dados cadastrais</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-bold text-muted-foreground">Data de nascimento</dt>
                <dd>{student.birth_date ? formatDateOnly(student.birth_date) : "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">CPF</dt>
                <dd>{student.cpf ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Telefone</dt>
                <dd>{student.phone ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">E-mail</dt>
                <dd>{student.email ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Endereço</dt>
                <dd>{student.address ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Contato de emergência</dt>
                <dd>{student.emergency_contact ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Matrícula desde</dt>
                <dd>{student.enrollment_date ? formatDateOnly(student.enrollment_date) : "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="font-heading text-lg font-semibold">Responsáveis</h2>
            <div className="mt-3 space-y-2">
              {(guardianLinks ?? []).map((link, index) => (
                <div key={`${link.guardians?.name}-${index}`}>
                  <p className="font-bold">
                    {link.guardians?.name ?? "-"}
                    {link.is_primary ? " · principal" : ""}
                    {link.is_financial_responsible ? " · financeiro" : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {link.guardians?.relationship ?? "-"} · {link.guardians?.phone ?? "-"}
                  </p>
                </div>
              ))}
              {!guardianLinks?.length && (
                <p className="text-muted-foreground">Nenhum responsável vinculado.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="font-heading text-lg font-semibold">Histórico de graduações</h2>
            <div className="mt-3 space-y-2">
              {(graduationHistoryRows ?? []).map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-2">
                  <BeltWithPreview name={row.new_belt?.name ?? "Faixa"} degree={row.new_degree} />
                  <span className="text-muted-foreground">{formatDateOnly(row.graduation_date)}</span>
                </div>
              ))}
              {!graduationHistoryRows?.length && (
                <p className="text-muted-foreground">Nenhuma graduação registrada.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <h2 className="font-heading text-lg font-semibold">Financeiro</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-bold text-muted-foreground">Situação</dt>
                <dd>{SITUACAO_LABEL[financialSummary.situacaoFinanceira]}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Plano atual</dt>
                <dd>{financialSummary.contract?.planName ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Valor em aberto</dt>
                <dd>{formatMoney(financialSummary.valorEmAberto)}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Valor vencido</dt>
                <dd>{formatMoney(financialSummary.valorVencido)}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Total pago</dt>
                <dd>{formatMoney(financialSummary.totalPago)}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted-foreground">Total contratado</dt>
                <dd>{formatMoney(financialSummary.totalContratado)}</dd>
              </div>
            </dl>
          </div>

          <MedalsSection
            medals={medals}
            canEdit
            events={medalFormData.events}
            modalities={medalFormData.modalities}
          />

          <AttendanceHistory studentId={id} />
        </section>

        <aside>
          <InternalNotesSection studentId={id} notes={notes} />
        </aside>
      </div>
    </div>
  );
}
