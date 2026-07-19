"use client";

import { useRouter } from "next/navigation";
import { formatDateOnly } from "@/lib/dates/format";
import type { MedalEventOption } from "@/modules/medals/events";

export function RankingFilters({
  basePath,
  availableYears,
  events,
  selectedYear,
  selectedEventId,
}: {
  basePath: string;
  availableYears: number[];
  events: MedalEventOption[];
  selectedYear: number;
  selectedEventId?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="ranking-year">
          Ano
        </label>
        <select
          id="ranking-year"
          value={selectedEventId ? "" : String(selectedYear)}
          disabled={Boolean(selectedEventId)}
          onChange={(event) => router.push(`${basePath}?year=${event.target.value}`)}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm disabled:opacity-50"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="ranking-event">
          Filtrar por evento
        </label>
        <select
          id="ranking-event"
          value={selectedEventId ?? ""}
          onChange={(event) =>
            router.push(
              event.target.value
                ? `${basePath}?event=${event.target.value}`
                : `${basePath}?year=${selectedYear}`,
            )
          }
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm"
        >
          <option value="">Todos os eventos (ranking por ano)</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} — {formatDateOnly(event.eventDate)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
