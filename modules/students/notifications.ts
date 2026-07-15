"use server";

import { requireStudent } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type NotificationPayload = {
  className?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  installmentNumber?: number;
  amount?: number;
  dueDate?: string;
};

export type StudentNotification = {
  id: string;
  type: string;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
};

export type NotificationActionResult = { error?: string };

/** Feed de notificações do aluno (seção 4.5 da spec), mais recente primeiro. */
export async function getStudentNotifications(): Promise<StudentNotification[]> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    payload: (n.payload ?? {}) as NotificationPayload,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
}

export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("student_id", profile.id)
    .is("read_at", null);

  return error ? { error: error.message } : {};
}
