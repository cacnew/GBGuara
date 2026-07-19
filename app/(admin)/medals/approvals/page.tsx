import { requireUser } from "@/lib/permissions";
import { ApprovalQueue } from "@/components/medals/approval-queue";
import { getPendingMedals } from "@/modules/medals/approvals";

export default async function MedalApprovalsPage() {
  await requireUser();
  const medals = await getPendingMedals();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Aprovação de medalhas</h1>
      <ApprovalQueue medals={medals} />
    </div>
  );
}
