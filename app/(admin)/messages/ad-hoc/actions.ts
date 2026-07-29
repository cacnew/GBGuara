"use server";

import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  sendAdHocMessage as sendAdHocMessageCore,
  type SendAdHocMessageInput,
  type SendAdHocMessageResult,
} from "@/modules/ad-hoc-messages/send";

export type { SendAdHocMessageInput, SendAdHocMessageResult };

export async function sendAdHocMessage(
  input: SendAdHocMessageInput,
): Promise<SendAdHocMessageResult> {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  return sendAdHocMessageCore(input, {
    supabase,
    schoolId: profile.schoolId,
    userId: profile.id,
  });
}
