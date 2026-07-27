"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/audit/log";
import type { HolidayFormInput } from "@/lib/validations/holiday";

export type HolidaySummary = {
  id: string;
  name: string;
  date: string;
  recurring: boolean;
  hasClass: boolean;
  customMessage: string | null;
};

export type HolidayActionResult = { error?: string; id?: string };

function revalidateHolidayPaths() {
  revalidatePath("/calendar/holidays");
}

export async function getHolidays(): Promise<HolidaySummary[]> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("holidays")
    .select("id, name, date, recurring, has_class, custom_message")
    .eq("school_id", profile.schoolId)
    .order("date", { ascending: true });

  return (data ?? []).map((holiday) => ({
    id: holiday.id,
    name: holiday.name,
    date: holiday.date,
    recurring: holiday.recurring,
    hasClass: holiday.has_class,
    customMessage: holiday.custom_message,
  }));
}

export async function getHoliday(id: string): Promise<HolidaySummary | null> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("holidays")
    .select("id, name, date, recurring, has_class, custom_message")
    .eq("id", id)
    .eq("school_id", profile.schoolId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    date: data.date,
    recurring: data.recurring,
    hasClass: data.has_class,
    customMessage: data.custom_message,
  };
}

export async function createHoliday(input: HolidayFormInput): Promise<HolidayActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: holiday, error } = await supabase
    .from("holidays")
    .insert({
      school_id: profile.schoolId,
      name: input.name,
      date: input.date,
      recurring: input.recurring,
      has_class: input.hasClass,
      custom_message: input.customMessage || null,
    })
    .select("id")
    .single();

  if (error || !holiday) {
    if (error?.code === "23505") {
      return { error: "Já existe um feriado cadastrado nesta data." };
    }
    return { error: error?.message ?? "Não foi possível criar o feriado" };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "holiday",
    entityId: holiday.id,
    action: "holiday_created",
  });

  revalidateHolidayPaths();
  return { id: holiday.id };
}

export async function updateHoliday(
  id: string,
  input: HolidayFormInput,
): Promise<HolidayActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("holidays")
    .update({
      name: input.name,
      date: input.date,
      recurring: input.recurring,
      has_class: input.hasClass,
      custom_message: input.customMessage || null,
    })
    .eq("id", id)
    .eq("school_id", profile.schoolId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um feriado cadastrado nesta data." };
    }
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "holiday",
    entityId: id,
    action: "holiday_updated",
  });

  revalidateHolidayPaths();
  return { id };
}

export async function deleteHoliday(id: string): Promise<HolidayActionResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("holidays")
    .delete()
    .eq("id", id)
    .eq("school_id", profile.schoolId);

  if (error) return { error: error.message };

  await logAuditEvent({
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
    entityType: "holiday",
    entityId: id,
    action: "holiday_deleted",
  });

  revalidateHolidayPaths();
  return {};
}
