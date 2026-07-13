"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDateOnly } from "@/lib/dates/format";
import type { AcademyData } from "@/modules/students/academy";

type Tab = "instrutores" | "alunos" | "aulas";

const TABS: { id: Tab; label: string }[] = [
  { id: "instrutores", label: "Instrutores" },
  { id: "alunos", label: "Alunos" },
  { id: "aulas", label: "Aulas" },
];

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={name} className="size-10 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function AcademyClient({ data }: { data: AcademyData }) {
  const [tab, setTab] = useState<Tab>("instrutores");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredInstructors = useMemo(
    () => data.instructors.filter((i) => i.name.toLowerCase().includes(normalizedQuery)),
    [data.instructors, normalizedQuery],
  );
  const filteredStudents = useMemo(
    () => data.students.filter((s) => s.name.toLowerCase().includes(normalizedQuery)),
    [data.students, normalizedQuery],
  );
  const filteredClasses = useMemo(
    () => data.classes.filter((c) => c.name.toLowerCase().includes(normalizedQuery)),
    [data.classes, normalizedQuery],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground md:p-6">
      <h1 className="font-heading text-2xl font-semibold">Minha Academia</h1>

      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-bold",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Buscar em ${TABS.find((t) => t.id === tab)?.label.toLowerCase()}...`}
        className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />

      {tab === "instrutores" && (
        <div className="space-y-2">
          {filteredInstructors.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <Avatar name={i.name} photoUrl={i.photoUrl} />
              <p className="font-medium">{i.name}</p>
            </div>
          ))}
          {!filteredInstructors.length && (
            <p className="text-sm text-muted-foreground">Nenhum instrutor encontrado.</p>
          )}
        </div>
      )}

      {tab === "alunos" && (
        <div className="space-y-2">
          {filteredStudents.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <Avatar name={s.name} photoUrl={s.photoUrl} />
              <div>
                <p className="font-medium">{s.name}</p>
                {s.beltName && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="inline-block size-2.5 rounded-full border border-border"
                      style={{ backgroundColor: s.beltColorHex ?? undefined }}
                    />
                    {s.beltName} · grau {s.currentDegree}
                  </p>
                )}
              </div>
            </div>
          ))}
          {!filteredStudents.length && (
            <p className="text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
          )}
        </div>
      )}

      {tab === "aulas" && (
        <div className="space-y-2">
          {filteredClasses.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{c.name}</p>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                  {c.status === "active" ? "Active" : c.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {c.startTime.slice(0, 5)} até {c.endTime.slice(0, 5)}
                {c.teacherName ? ` · ${c.teacherName}` : ""}
              </p>
              {(c.startDate || c.endDate) && (
                <p className="text-xs text-muted-foreground">
                  {c.startDate ? formatDateOnly(c.startDate) : "—"} –{" "}
                  {c.endDate ? formatDateOnly(c.endDate) : "—"}
                </p>
              )}
            </div>
          ))}
          {!filteredClasses.length && (
            <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
          )}
        </div>
      )}
    </div>
  );
}
