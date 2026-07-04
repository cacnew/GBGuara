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
    <div className="flex flex-1 flex-col gap-6">
      <StudentSearch
        onSelect={handleSelect}
        excludeIds={present.map((p) => p.studentId)}
      />

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold">
          Presentes ({present.length})
        </h2>
        {present.map((p) => (
          <div
            key={p.studentId}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm font-medium"
          >
            {p.name}
            <button
              type="button"
              onClick={() => handleRemove(p)}
              disabled={removingId === p.attendanceId}
              className="text-xs font-normal text-destructive hover:underline disabled:opacity-50"
            >
              {removingId === p.attendanceId ? "Removendo..." : "Remover"}
            </button>
          </div>
        ))}
        {!present.length && (
          <p className="text-sm text-muted-foreground">
            Ninguém marcado presente ainda.
          </p>
        )}
      </div>
    </div>
  );
}
