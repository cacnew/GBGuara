"use client";

import { useMemo, useState } from "react";
import type { LandingScheduleClass } from "@/modules/landing/queries";

const days = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terca" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sabado" },
];

export function LandingSchedule({ classes }: { classes: LandingScheduleClass[] }) {
  const firstAvailableDay = days.find((day) =>
    classes.some((classGroup) => classGroup.weekDays.includes(day.value)),
  )?.value;
  const [activeDay, setActiveDay] = useState(firstAvailableDay ?? 1);
  const visibleClasses = useMemo(
    () =>
      classes
        .filter((classGroup) => classGroup.weekDays.includes(activeDay))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activeDay, classes],
  );

  return (
    <div className="landing-schedule">
      <div className="landing-day-tabs" role="tablist" aria-label="Dias da semana">
        {days.map((day) => (
          <button
            key={day.value}
            type="button"
            role="tab"
            aria-selected={activeDay === day.value}
            className={activeDay === day.value ? "is-active" : ""}
            onClick={() => setActiveDay(day.value)}
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="landing-class-list">
        {visibleClasses.map((classGroup) => (
          <article key={classGroup.id} className="landing-class-row">
            <div className="landing-class-time">{classGroup.startTime.slice(0, 5)}</div>
            <div>
              <h3>{classGroup.name}</h3>
              <p>{classGroup.modality || "Jiu-jitsu"}</p>
            </div>
            <div className="landing-class-teacher">{classGroup.teacher || "Professor"}</div>
          </article>
        ))}
        {!visibleClasses.length && (
          <div className="landing-empty-schedule">
            Nenhuma turma publicada para este dia.
          </div>
        )}
      </div>
    </div>
  );
}
