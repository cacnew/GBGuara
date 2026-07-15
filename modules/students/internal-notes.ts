"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type InternalNote = {
  id: string;
  note: string;
  authorName: string | null;
  createdAt: string;
};

export type InternalNoteActionResult = { error?: string };

/**
 * Observações internas do dossiê (Fase 10.7) — admin/professor apenas
 * (`requireUser` aceita qualquer staff autenticado). Nunca exposto ao
 * aluno: `student_internal_notes` não tem nenhuma policy de select para
 * aluno (ver migration).
 */
export async function getInternalNotes(studentId: string): Promise<InternalNote[]> {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("student_internal_notes")
    .select("id, note, created_at, users(name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    note: row.note,
    authorName: row.users?.name ?? null,
    createdAt: row.created_at,
  }));
}

export async function addInternalNote(
  studentId: string,
  note: string,
): Promise<InternalNoteActionResult> {
  const profile = await requireUser();

  if (!note.trim()) {
    return { error: "A observação não pode estar vazia." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("student_internal_notes").insert({
    school_id: profile.schoolId,
    student_id: studentId,
    author_user_id: profile.id,
    note: note.trim(),
  });

  if (error) return { error: error.message };

  revalidatePath(`/students/${studentId}/dossie`);
  revalidatePath(`/professor/students/${studentId}`);
  return {};
}
