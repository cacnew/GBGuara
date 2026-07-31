import { BackLink } from "@/components/layout/back-link";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { requireStudent } from "@/lib/permissions";
import { createFeedback } from "@/modules/feedback/student-actions";

export default async function NewFeedbackPage() {
  const profile = await requireStudent();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-4 text-foreground md:p-6">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Fale Conosco</h1>
        <BackLink href="/aluno/fale-conosco" />
      </div>
      <FeedbackForm schoolId={profile.schoolId} studentId={profile.id} onCreate={createFeedback} />
    </div>
  );
}
