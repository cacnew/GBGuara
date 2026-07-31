import { requireUser } from "@/lib/permissions";
import { StaffFeedbackList } from "@/components/feedback/staff-feedback-list";
import { getStaffFeedback } from "@/modules/feedback/staff-actions";

export default async function TeacherFaleConoscoPage() {
  await requireUser();
  const items = await getStaffFeedback();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Fale Conosco</h1>
      <StaffFeedbackList items={items} basePath="/professor/fale-conosco" />
    </div>
  );
}
