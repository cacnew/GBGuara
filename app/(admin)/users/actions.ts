"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createUserSchema,
  updateUserAccessSchema,
  type CreateUserInput,
  type UpdateUserAccessInput,
} from "@/lib/validations/user";
import { logAuditEvent } from "@/modules/audit/log";

export type UserActionResult = { error?: string };

async function countActiveAdmins(schoolId: string, exceptUserId?: string) {
  const admin = createAdminClient();
  let request = admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("role", "admin")
    .eq("status", "active");

  if (exceptUserId) {
    request = request.neq("id", exceptUserId);
  }

  const { count } = await request;
  return count ?? 0;
}

export async function createUser(input: CreateUserInput): Promise<UserActionResult> {
  const adminProfile = await requireRole("admin");
  const parsed = createUserSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const { name, email, password, role } = parsed.data;
  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Nao foi possivel criar o usuario" };
  }

  const { data: newUser, error: dbError } = await admin
    .from("users")
    .insert({
      school_id: adminProfile.schoolId,
      auth_user_id: authData.user.id,
      name,
      email,
      role,
      status: "active",
    })
    .select("id")
    .single();

  if (dbError || !newUser) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: dbError?.message ?? "Nao foi possivel criar o usuario" };
  }

  await admin.from("audit_logs").insert({
    school_id: adminProfile.schoolId,
    user_id: adminProfile.id,
    entity_type: "user",
    entity_id: newUser.id,
    action: "user_created",
    changes: { role },
  });

  revalidatePath("/users");
  return {};
}

export async function updateUserAccess(
  userId: string,
  input: UpdateUserAccessInput,
): Promise<UserActionResult> {
  const adminProfile = await requireRole("admin");
  const parsed = updateUserAccessSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const supabase = await createClient();
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("id", userId)
    .eq("school_id", adminProfile.schoolId)
    .single();

  if (fetchError || !user) {
    return { error: "Usuario nao encontrado" };
  }

  const nextRole = parsed.data.role;
  const nextStatus = parsed.data.status;
  const removesActiveAdmin =
    user.role === "admin" && user.status === "active" &&
    (nextRole !== "admin" || nextStatus !== "active");

  if (removesActiveAdmin) {
    const remainingAdmins = await countActiveAdmins(adminProfile.schoolId, user.id);
    if (remainingAdmins === 0) {
      return { error: "A escola precisa manter pelo menos um admin ativo" };
    }
  }

  if (user.id === adminProfile.id && (nextRole !== "admin" || nextStatus !== "active")) {
    return { error: "Voce nao pode remover seu proprio acesso de admin ativo" };
  }

  const { error } = await supabase
    .from("users")
    .update({ role: nextRole, status: nextStatus })
    .eq("id", user.id)
    .eq("school_id", adminProfile.schoolId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent({
    supabase,
    schoolId: adminProfile.schoolId,
    userId: adminProfile.id,
    entityType: "user",
    entityId: user.id,
    action: "user_access_updated",
    changes: {
      previousRole: user.role,
      previousStatus: user.status,
      role: nextRole,
      status: nextStatus,
    },
  });

  revalidatePath("/users");
  return {};
}
