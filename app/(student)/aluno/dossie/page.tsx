import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateOnly } from "@/lib/dates/format";
import { getStudentDashboard } from "@/modules/students/dashboard";
import { getStudentFinance, type SituacaoFinanceira } from "@/modules/students/finance";
import { MedalsSection } from "@/components/students/medals-section";
import { getApprovedMedalsForStudent } from "@/modules/medals/history";

const SITUACAO_LABEL: Record<SituacaoFinanceira, string> = {
  sem_contrato: "Sem contrato",
  isento: "Isento",
  inadimplente: "Inadimplente",
  pausado: "Pausado",
  encerrado: "Encerrado",
  regular: "Regular",
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function StudentDossiePage() {
  const profile = await requireStudent();
  const supabase = await createClient();
  const year = new Date().getUTCFullYear();

  const [{ data: student }, dashboard, finance, medals] = await Promise.all([
    supabase
      .from("students")
      .select(
        "name, birth_date, cpf, phone, email, address, emergency_contact, photo_url, enrollment_date",
      )
      .eq("id", profile.id)
      .single(),
    getStudentDashboard(year),
    getStudentFinance(),
    getApprovedMedalsForStudent(profile.id, profile.schoolId),
  ]);

  const currentBelt = dashboard.beltTimeline.find((b) => b.isCurrent);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 text-foreground md:p-6">
      <h1 className="font-heading text-2xl font-semibold">Meu dossiê</h1>

      <section className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <AvatarInitials name={student?.name ?? ""} src={student?.photo_url} className="size-16" />
        <div>
          <h2 className="font-heading text-lg font-semibold">{student?.name}</h2>
          {currentBelt && (
            <div className="mt-1">
              <BeltWithPreview name={currentBelt.name} degree={dashboard.currentDegree} />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 text-sm">
        <h2 className="font-heading text-lg font-semibold">Dados cadastrais</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-bold text-muted-foreground">Data de nascimento</dt>
            <dd>{student?.birth_date ? formatDateOnly(student.birth_date) : "-"}</dd>
          </div>
          <div>
            <dt className="font-bold text-muted-foreground">CPF</dt>
            <dd>{student?.cpf ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-bold text-muted-foreground">Telefone</dt>
            <dd>{student?.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-bold text-muted-foreground">E-mail</dt>
            <dd>{student?.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-bold text-muted-foreground">Endereço</dt>
            <dd>{student?.address ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-bold text-muted-foreground">Contato de emergência</dt>
            <dd>{student?.emergency_contact ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-bold text-muted-foreground">Matrícula desde</dt>
            <dd>{student?.enrollment_date ? formatDateOnly(student.enrollment_date) : "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 text-sm">
        <h2 className="font-heading text-lg font-semibold">Histórico de graduações</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {dashboard.beltTimeline
            .filter((b) => b.achieved)
            .map((b) => (
              <BeltWithPreview
                key={b.id}
                name={b.name}
                degree={b.isCurrent ? dashboard.currentDegree : undefined}
              />
            ))}
          {!dashboard.beltTimeline.some((b) => b.achieved) && (
            <p className="text-muted-foreground">Faixa ainda não definida.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 text-sm">
        <h2 className="font-heading text-lg font-semibold">Financeiro</h2>
        {finance.contract ? (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-bold text-muted-foreground">Situação</dt>
              <dd>
                <StatusBadge
                  value={finance.situacaoFinanceira}
                  label={SITUACAO_LABEL[finance.situacaoFinanceira]}
                />
              </dd>
            </div>
            <div>
              <dt className="font-bold text-muted-foreground">Plano atual</dt>
              <dd>{finance.contract.planName}</dd>
            </div>
            <div>
              <dt className="font-bold text-muted-foreground">Valor em aberto</dt>
              <dd>{formatMoney(finance.valorEmAberto)}</dd>
            </div>
            <div>
              <dt className="font-bold text-muted-foreground">Total pago</dt>
              <dd>{formatMoney(finance.totalPago)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-muted-foreground">Nenhum plano associado no momento.</p>
        )}
      </section>

      <MedalsSection medals={medals} />

      <section className="rounded-lg border border-border bg-card p-4 text-sm">
        <h2 className="font-heading text-lg font-semibold">Histórico de presenças recentes</h2>
        <div className="mt-3 space-y-2">
          {dashboard.history.slice(0, 10).map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{h.className}</p>
                <p className="text-xs text-muted-foreground">
                  {h.teacherName ? `Professor ${h.teacherName}` : ""}
                </p>
              </div>
              <span className="text-muted-foreground">{formatDateOnly(h.date)}</span>
            </div>
          ))}
          {!dashboard.history.length && (
            <p className="text-muted-foreground">Nenhuma presença confirmada ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
