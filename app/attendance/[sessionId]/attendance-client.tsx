"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { StudentSearch } from "@/components/students/student-search";
import type { StudentSearchResult } from "@/modules/students/search";
import { markPresent, removeAttendance } from "@/modules/attendance/actions";
import { saveAttendanceNote, saveSessionReflection } from "@/modules/teacher/actions";

export type PresentStudent = {
  attendanceId: string;
  studentId: string;
  name: string;
  note: string;
};

export function AttendanceClient({
  classSessionId,
  initialPresent,
  initialLessonContent,
  initialSessionNotes,
}: {
  classSessionId: string;
  initialPresent: PresentStudent[];
  initialLessonContent: string;
  initialSessionNotes: string;
}) {
  const [present, setPresent] = useState<PresentStudent[]>(initialPresent);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState(initialLessonContent);
  const [sessionNotes, setSessionNotes] = useState(initialSessionNotes);
  const [savingReflection, setSavingReflection] = useState(false);

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
        note: "",
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

  async function handleSaveNote(p: PresentStudent, note: string) {
    setSavingNoteId(p.attendanceId);
    const result = await saveAttendanceNote(p.attendanceId, classSessionId, note);
    setSavingNoteId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Observacao salva.");
    setPresent((prev) =>
      prev.map((item) =>
        item.attendanceId === p.attendanceId ? { ...item, note } : item,
      ),
    );
  }

  async function handleSaveReflection() {
    setSavingReflection(true);
    const result = await saveSessionReflection(classSessionId, {
      lessonContent,
      notes: sessionNotes,
    });
    setSavingReflection(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Resumo da aula salvo.");
  }

  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-start">
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
        <div className="max-h-[calc(100dvh-13rem)] space-y-3 overflow-y-auto pr-1">
          {present.map((p) => (
            <div
              key={p.studentId}
              className="space-y-3 rounded-lg border border-border bg-card p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/professor/students/${p.studentId}`}
                  className="min-w-0 truncate font-bold hover:underline"
                >
                  {p.name}
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(p)}
                  disabled={removingId === p.attendanceId}
                  className="shrink-0 text-xs text-destructive hover:underline disabled:opacity-50"
                >
                  {removingId === p.attendanceId ? "Removendo..." : "Remover"}
                </button>
              </div>
              <textarea
                aria-label={`Observacao sobre ${p.name}`}
                defaultValue={p.note}
                rows={2}
                placeholder="Observacao do aluno..."
                className="w-full resize-y px-3 py-2 text-sm"
                onBlur={(event) => {
                  if (event.currentTarget.value !== p.note) {
                    void handleSaveNote(p, event.currentTarget.value);
                  }
                }}
              />
              {savingNoteId === p.attendanceId && (
                <p className="text-xs text-muted-foreground">Salvando...</p>
              )}
            </div>
          ))}
          {!present.length && (
            <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Nenhum aluno marcado presente ainda.
            </p>
          )}

          <div className="space-y-3 rounded-lg border border-border bg-background p-3">
            <h3 className="font-heading text-base font-semibold">Pos-aula</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Conteudo trabalhado
              </label>
              <textarea
                value={lessonContent}
                onChange={(event) => setLessonContent(event.target.value)}
                rows={3}
                placeholder="Ex: passagem de guarda, queda, sparring..."
                className="w-full resize-y px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">
                Observacao geral da aula
              </label>
              <textarea
                value={sessionNotes}
                onChange={(event) => setSessionNotes(event.target.value)}
                rows={3}
                placeholder="Resumo, pontos de atencao ou destaques..."
                className="w-full resize-y px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveReflection}
              disabled={savingReflection}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {savingReflection ? "Salvando..." : "Salvar pos-aula"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
