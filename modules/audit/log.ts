import { createClient } from "@/lib/supabase/server";

export async function logAuditEvent(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  schoolId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
}) {
  await params.supabase.from("audit_logs").insert({
    school_id: params.schoolId,
    user_id: params.userId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    changes: (params.changes ?? null) as never,
  });
}
