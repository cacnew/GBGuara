"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StudentSearch } from "@/components/students/student-search";
import type { StudentSearchResult } from "@/modules/students/search";
import {
  addStudentManually,
  closeRollCall,
  confirmAttendance,
  revertToSignaled,
  type RollCallAttendance,
} from "@/modules/attendance/roll-call";
import type { StudentGraduationStatus } from "@/modules/graduation/eligibility";

/**
 * Indicador de aptidão para graduação (Fase 13.2) — nunca altera a
 * faixa, só informa o professor durante a chamada. Sem meta configurada
 * para a transição atual (`requiredClasses === null`), não mostra nada.
 */
function GraduationEligibilityBadge({
  eligibility,
}: {
  eligibility: StudentGraduationStatus | null;
}) {
  if (!eligibility || eligibility.requiredClasses === null) return null;

  if (eligibility.isEligible) {
    return (
      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
        ✓ Apto para graduação
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">
      {eligibility.attendancesSinceLastGraduation} aulas · faltam {eligibility.remaining} para
      apto
    </span>
  );
}

export function RollCallClient({
  sessionId,
  initialAttendances,
  initialClosed,
}: {
  sessionId: string;
  initialAttendances: RollCallAttendance[];
  initialClosed: boolean;
}) {
  const router = useRouter();
  const [attendances, setAttendances] = useState(initialAttendances);
  const [closed, setClosed] = useState(initialClosed);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [, startTransition] = useTransition();

  const signaled = attendances.filter((a) => a.status === "signaled");
  const present = attendances.filter(
    (a) =>
      a.status === "confirmed" ||
      a.status === "added_by_instructor" ||
      a.status === "presente",
  );
  const excludeIds = attendances
    .filter((a) => a.status !== "cancelled")
    .map((a) => a.studentId);

  function refreshList() {
    router.refresh();
  }

  async function handleConfirm(attendanceId: string) {
    setPendingId(attendanceId);
    const result = await confirmAttendance(attendanceId);
    setPendingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setAttendances((prev) =>
      prev.map((a) =>
        a.attendanceId === attendanceId
          ? { ...a, status: "confirmed", confirmedAt: new Date().toISOString() }
          : a,
      ),
    );
    toast.success("Presença confirmada.");
    refreshList();
  }

  async function handleRevert(attendanceId: string) {
    setPendingId(attendanceId);
    const result = await revertToSignaled(attendanceId);
    setPendingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setAttendances((prev) =>
      prev.map((a) =>
        a.attendanceId === attendanceId
          ? { ...a, status: "signaled", confirmedAt: null }
          : a,
      ),
    );
    toast.success("Confirmação desfeita.");
    refreshList();
  }

  async function handleAddStudent(student: StudentSearchResult) {
    const result = await addStudentManually(sessionId, student.id);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`${student.name} incluído na chamada.`);
    setAttendances((prev) => [
      ...prev,
      {
        attendanceId: crypto.randomUUID(),
        studentId: student.id,
        studentName: student.name,
        photoUrl: student.photoUrl,
        beltName: student.beltName,
        beltColorHex: student.beltColorHex,
        currentDegree: student.currentDegree,
        status: "added_by_instructor",
        signaledAt: null,
        confirmedAt: new Date().toISOString(),
        graduationEligibility: null,
      },
    ]);
    refreshList();
  }

  async function handleClose() {
    setIsClosing(true);
    const result = await closeRollCall(sessionId);
    setIsClosing(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Chamada fechada.");
    setClosed(true);
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-start">
      <section className="min-w-0 space-y-4">
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold">
            Sinalizados ({signaled.length})
          </h2>
          <div className="space-y-2">
            {signaled.map((a) => (
              <div
                key={a.attendanceId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.studentName}</p>
                  <GraduationEligibilityBadge eligibility={a.graduationEligibility} />
                </div>
                <button
                  type="button"
                  onClick={() => handleConfirm(a.attendanceId)}
                  disabled={closed || pendingId === a.attendanceId}
                  className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  {pendingId === a.attendanceId ? "Confirmando..." : "Confirmar presença"}
                </button>
              </div>
            ))}
            {!signaled.length && (
              <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                Ninguém sinalizado pendente de confirmação.
              </p>
            )}
          </div>
        </div>

        {!closed && (
          <div className="space-y-2">
            <h2 className="font-heading text-lg font-semibold">Adicionar aluno</h2>
            <StudentSearch onSelect={handleAddStudent} excludeIds={excludeIds} />
          </div>
        )}
      </section>

      <section className="min-w-0 space-y-2 lg:sticky lg:top-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">
            Presentes ({present.length})
          </h2>
          {closed ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              Chamada fechada
            </span>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              disabled={isClosing}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {isClosing ? "Fechando..." : "Fechar chamada"}
            </button>
          )}
        </div>

        <div className="max-h-[calc(100dvh-13rem)] space-y-2 overflow-y-auto pr-1">
          {present.map((a) => (
            <div
              key={a.attendanceId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{a.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {a.status === "added_by_instructor"
                    ? "Incluído pelo professor"
                    : a.status === "presente"
                      ? "Marcado presente (chamada rápida)"
                      : "Confirmado"}
                </p>
                <GraduationEligibilityBadge eligibility={a.graduationEligibility} />
              </div>
              {a.status === "confirmed" && (
                <button
                  type="button"
                  onClick={() => handleRevert(a.attendanceId)}
                  disabled={closed || pendingId === a.attendanceId}
                  className="shrink-0 text-xs text-destructive hover:underline disabled:opacity-50"
                >
                  {pendingId === a.attendanceId ? "Desfazendo..." : "Desfazer"}
                </button>
              )}
            </div>
          ))}
          {!present.length && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Nenhum aluno confirmado ainda.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
