"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StudentSearch } from "@/components/students/student-search";
import type { StudentSearchResult } from "@/modules/students/search";
import { markPresent, removeAttendance } from "@/modules/attendance/actions";

export type PresentStudent = {
  attendanceId: string;
  studentId: string;
  name: string;
};

export function AttendanceClient({
  classSessionId,
  initialPresent,
}: {
  classSessionId: string;
  initialPresent: PresentStudent[];
}) {
  const [present, setPresent] = useState<PresentStudent[]>(initialPresent);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleSelect(student: StudentSearchResult) {
    const result = await markPresent(classSessionId, student.id);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`${student.name} marcado presente.`);
    setPresent((prev) => [
      ...prev,
      {
        attendanceId: result.attendanceId!,
        studentId: student.id,
        name: student.name,
      },
    ]);
  }

  async function handleRemove(p: PresentStudent) {
    setRemovingId(p.attendanceId);
    const result = await removeAttendance(p.attendanceId, classSessionId);
    setRemovingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`${p.name} removido da chamada.`);
    setPresent((prev) =>
      prev.filter((item) => item.attendanceId !== p.attendanceId),
    );
  }

  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-start">
      <section className="min-w-0 space-y-2">
        <h2 className="font-heading text-lg font-semibold">Todos os alunos</h2>
        <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto pr-1">
          <StudentSearch
            onSelect={handleSelect}
            excludeIds={present.map((p) => p.studentId)}
          />
        </div>
      </section>

      <section className="min-w-0 space-y-2 lg:sticky lg:top-0">
        <h2 className="font-heading text-lg font-semibold">
          Presentes ({present.length})
        </h2>
        <div className="max-h-[calc(100dvh-13rem)] space-y-2 overflow-y-auto pr-1">
          {present.map((p) => (
            <div
              key={p.studentId}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm font-medium"
            >
              <span className="min-w-0 truncate">{p.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(p)}
                disabled={removingId === p.attendanceId}
                className="shrink-0 text-xs font-normal text-destructive hover:underline disabled:opacity-50"
              >
                {removingId === p.attendanceId ? "Removendo..." : "Remover"}
              </button>
            </div>
          ))}
          {!present.length && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Nenhum aluno marcado presente ainda.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
