"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { BeltPreview } from "@/components/belts/belt-preview";
import { formatDateOnly } from "@/lib/dates/format";
import type { StudentDashboard } from "@/modules/students/dashboard";

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function firstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

export function PainelClient({
  year,
  dashboard,
}: {
  year: number;
  dashboard: StudentDashboard;
}) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getUTCMonth());

  const maxCount = Math.max(1, ...dashboard.monthlyCounts);
  const trainedDaySet = useMemo(() => {
    const prefix = `${year}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return new Set(
      dashboard.trainedDates
        .filter((d) => d.startsWith(prefix))
        .map((d) => Number(d.slice(8, 10))),
    );
  }, [dashboard.trainedDates, year, selectedMonth]);

  const historyForMonth = useMemo(() => {
    const prefix = `${year}-${String(selectedMonth + 1).padStart(2, "0")}`;
    return dashboard.history.filter((h) => h.date.startsWith(prefix));
  }, [dashboard.history, year, selectedMonth]);

  const totalDays = daysInMonth(year, selectedMonth);
  const leadingBlanks = firstWeekday(year, selectedMonth);
  const currentBelt = dashboard.beltTimeline.find((b) => b.isCurrent);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 text-foreground md:p-6">
      <h1 className="font-heading text-2xl font-semibold">Painel</h1>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Total de treinos em {year}
        </h2>
        <div
          role="img"
          aria-label={`Treinos por mês em ${year}: ${dashboard.monthlyCounts
            .map((c, i) => `${MONTH_LABELS[i]} ${c}`)
            .join(", ")}`}
          className="flex items-end gap-2 rounded-lg border border-border bg-card p-4"
        >
          {dashboard.monthlyCounts.map((count, month) => (
            <button
              key={month}
              type="button"
              title={`${MONTH_LABELS[month]}: ${count} treino${count === 1 ? "" : "s"}`}
              onClick={() => setSelectedMonth(month)}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs text-muted-foreground">{count || ""}</span>
              <span
                className={cn(
                  "w-full rounded-t-sm transition-colors",
                  month === selectedMonth ? "bg-primary" : "bg-primary/40 hover:bg-primary/60",
                )}
                style={{ height: `${Math.max(4, (count / maxCount) * 80)}px` }}
              />
              <span
                className={cn(
                  "text-xs",
                  month === selectedMonth ? "font-bold text-foreground" : "text-muted-foreground",
                )}
              >
                {MONTH_LABELS[month]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Evolução das faixas</h2>
        <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-4">
          {dashboard.beltTimeline.map((belt) => (
            <span
              key={belt.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset",
                belt.isCurrent
                  ? "bg-primary text-primary-foreground ring-primary"
                  : belt.achieved
                    ? "bg-secondary text-secondary-foreground ring-border"
                    : "bg-transparent text-muted-foreground ring-border",
              )}
            >
              <BeltPreview name={belt.name} className="h-4 w-12" />
              {belt.name}
              {belt.isCurrent && ` · grau ${dashboard.currentDegree}`}
            </span>
          ))}
          {!dashboard.beltTimeline.length && (
            <p className="text-sm text-muted-foreground">
              Faixa ainda não definida.
            </p>
          )}
        </div>
        {currentBelt && (
          <p className="text-sm text-muted-foreground">
            Faixa atual: <strong className="text-foreground">{currentBelt.name}</strong> · grau {dashboard.currentDegree}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Calendário — {MONTH_LABELS[selectedMonth]}/{year}
          </h2>
        </div>
        <div className="max-w-sm rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
              <span
                key={day}
                className={cn(
                  "flex flex-col items-center rounded-md py-1 text-sm text-foreground",
                  trainedDaySet.has(day) && "bg-primary/10 font-bold text-primary",
                )}
              >
                {day}
                <span
                  className={cn(
                    "mt-0.5 size-1 rounded-full",
                    trainedDaySet.has(day) ? "bg-primary" : "bg-transparent",
                  )}
                />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Histórico de aulas — {MONTH_LABELS[selectedMonth]}/{year}
        </h2>
        <div className="space-y-2">
          {historyForMonth.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{h.className}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateOnly(h.date)} · {h.startTime.slice(0, 5)}
                  {h.teacherName ? ` · ${h.teacherName}` : ""}
                </p>
              </div>
            </div>
          ))}
          {!historyForMonth.length && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Nenhuma presença confirmada nesse mês.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
