import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateOnly } from "@/lib/dates/format";
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TARGET_LABELS,
  FEEDBACK_TYPE_LABELS,
} from "@/modules/feedback/labels";
import { getMyFeedback } from "@/modules/feedback/student-actions";

export default async function FaleConoscoPage() {
  const items = await getMyFeedback();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Fale Conosco</h1>
        <Link href="/aluno/fale-conosco/new" className={buttonVariants({ size: "sm" })}>
          Nova mensagem
        </Link>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/aluno/fale-conosco/${item.id}`}
            className="block rounded-lg border border-border bg-card p-3 text-sm hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {FEEDBACK_TYPE_LABELS[item.type]} · {FEEDBACK_TARGET_LABELS[item.target]} ·{" "}
                  {formatDateOnly(item.createdAt.slice(0, 10))}
                </p>
              </div>
              <StatusBadge value={item.status} label={FEEDBACK_STATUS_LABELS[item.status]} />
            </div>
          </Link>
        ))}
        {!items.length && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
            Nenhuma mensagem enviada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
