"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dates/format";
import { signalAttendance, cancelSignal, type AgendaClass } from "@/modules/students/agenda";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function weekdayLabel(date: string): string {
  return WEEKDAY_LABELS[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

function dayNumber(date: string): string {
  return date.slice(8, 10);
}

const SEX_LABEL: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
};

export function AgendaClient({
  weekDates,
  daysWithClasses,
  selectedDate,
  classes,
}: {
  weekDates: string[];
  daysWithClasses: string[];
  selectedDate: string;
  classes: AgendaClass[];
}) {
  const router = useRouter();
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleClasses = showOnlyMine ? classes.filter((c) => c.signaled) : classes;

  function handleToggleSignal(classItem: AgendaClass) {
    setPendingId(classItem.classGroupId);
    startTransition(async () => {
      const action = classItem.signaled ? cancelSignal : signalAttendance;
      const result = await action(classItem.classGroupId, selectedDate);
      setPendingId(null);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(classItem.signaled ? "Sinalização cancelada." : "Presença sinalizada!");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Agenda</h1>
        <div className="flex overflow-hidden rounded-lg border border-border text-sm font-bold">
          <button
            type="button"
            onClick={() => setShowOnlyMine(true)}
            className={cn(
              "px-3 py-1.5",
              showOnlyMine ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
            )}
          >
            Minhas
          </button>
          <button
            type="button"
            onClick={() => setShowOnlyMine(false)}
            className={cn(
              "px-3 py-1.5",
              !showOnlyMine ? "bg-primary text-primary-foreground" : "bg-background text-foreground",
            )}
          >
            Todas
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {weekDates.map((date) => {
          const isSelected = date === selectedDate;
          const hasClasses = daysWithClasses.includes(date);
          return (
            <Link
              key={date}
              href={`/aluno?date=${date}`}
              className={cn(
                "flex shrink-0 flex-col items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-foreground",
              )}
            >
              <span className="font-bold">{weekdayLabel(date)}</span>
              <span>{dayNumber(date)}</span>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  hasClasses ? (isSelected ? "bg-primary-foreground" : "bg-primary") : "bg-transparent",
                )}
              />
            </Link>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">{formatDateOnly(selectedDate)}</p>

      <div className="flex flex-col gap-3">
        {visibleClasses.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {showOnlyMine ? "Você não sinalizou presença em nenhuma aula nesse dia." : "Nenhuma aula nesse dia."}
          </p>
        )}

        {visibleClasses.map((classItem) => {
          const disabledReason = classItem.sessionClosed
            ? "Chamada encerrada"
            : !classItem.eligible
              ? classItem.ineligibleReason
              : classItem.capacity != null && classItem.occupied >= classItem.capacity && !classItem.signaled
                ? "Turma lotada"
                : null;

          const isPendingThis = isPending && pendingId === classItem.classGroupId;

          return (
            <div
              key={classItem.classGroupId}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold">{classItem.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {classItem.startTime.slice(0, 5)} até {classItem.endTime.slice(0, 5)}
                  </p>
                  {classItem.teacherName && (
                    <p className="text-sm text-muted-foreground">{classItem.teacherName}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-secondary px-2 py-0.5 font-bold text-secondary-foreground">
                  Alunos {classItem.occupied}
                  {classItem.capacity != null ? `/${classItem.capacity}` : ""}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 font-bold text-secondary-foreground">
                  Sexo {classItem.sexRestriction ? SEX_LABEL[classItem.sexRestriction] : "Todas"}
                </span>
                {classItem.minBeltName && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-bold text-secondary-foreground">
                    Faixa {classItem.minBeltName}
                  </span>
                )}
                {classItem.minDegree != null && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-bold text-secondary-foreground">
                    Graus {classItem.minDegree}
                  </span>
                )}
              </div>

              <Button
                type="button"
                variant={classItem.signaled ? "outline" : "default"}
                disabled={Boolean(disabledReason) || isPendingThis}
                onClick={() => handleToggleSignal(classItem)}
              >
                {isPendingThis
                  ? "Enviando..."
                  : disabledReason
                    ? disabledReason
                    : classItem.signaled
                      ? "Cancelar sinalização"
                      : "Sinalizar presença"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
