"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StudentSearch } from "@/components/students/student-search";
import type { StudentSearchResult } from "@/modules/students/search";
import { markPresent } from "@/modules/attendance/actions";

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
            className="rounded-lg border border-border bg-card p-3 text-sm font-medium"
          >
            {p.name}
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
