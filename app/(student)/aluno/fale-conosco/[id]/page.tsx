import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { FeedbackThread } from "@/components/feedback/feedback-thread";
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TARGET_LABELS,
  FEEDBACK_TYPE_LABELS,
} from "@/modules/feedback/labels";
import { getMyFeedbackThread, replyToFeedback } from "@/modules/feedback/student-actions";

export default async function FeedbackThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getMyFeedbackThread(id);
  if (!thread) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-4 text-foreground md:p-6">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-semibold">{thread.title}</h1>
        <BackLink href="/aluno/fale-conosco" />
      </div>
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {FEEDBACK_TYPE_LABELS[thread.type]} · {FEEDBACK_TARGET_LABELS[thread.target]}
        </p>
        <StatusBadge value={thread.status} label={FEEDBACK_STATUS_LABELS[thread.status]} />
      </div>
      <FeedbackThread feedbackId={thread.id} messages={thread.messages} onReply={replyToFeedback} />
    </div>
  );
}
