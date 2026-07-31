import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions";
import { BackLink } from "@/components/layout/back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { FeedbackThread } from "@/components/feedback/feedback-thread";
import { FeedbackStatusControl } from "@/components/feedback/feedback-status-control";
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TARGET_LABELS,
  FEEDBACK_TYPE_LABELS,
} from "@/modules/feedback/labels";
import {
  getStaffFeedbackThread,
  replyToFeedbackAsStaff,
  updateFeedbackStatus,
} from "@/modules/feedback/staff-actions";

export default async function TeacherFeedbackThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const thread = await getStaffFeedbackThread(id);
  if (!thread) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-semibold">{thread.title}</h1>
        <BackLink href="/professor/fale-conosco" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {thread.studentName} · {FEEDBACK_TYPE_LABELS[thread.type]} ·{" "}
          {FEEDBACK_TARGET_LABELS[thread.target]}
          {thread.teacherName ? ` (${thread.teacherName})` : ""}
        </p>
        <div className="flex items-center gap-3">
          <StatusBadge value={thread.status} label={FEEDBACK_STATUS_LABELS[thread.status]} />
          <FeedbackStatusControl
            feedbackId={thread.id}
            status={thread.status}
            onUpdate={updateFeedbackStatus}
          />
        </div>
      </div>
      <FeedbackThread feedbackId={thread.id} messages={thread.messages} onReply={replyToFeedbackAsStaff} />
    </div>
  );
}
