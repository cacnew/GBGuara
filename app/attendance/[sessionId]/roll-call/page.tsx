import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/dates/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSessionRollCall } from "@/modules/attendance/roll-call";
import { RollCallClient } from "./roll-call-client";

export default async function RollCallPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const profile = await requireUser();
  const backHref = profile.role === "admin" ? "/today" : "/professor";
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("class_sessions")
    .select(
      "id, date, attendance_closed_at, class_groups(name, modalities(name))",
    )
    .eq("id", sessionId)
    .single();

  if (!session) notFound();

  const attendances = await getSessionRollCall(sessionId);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 text-foreground">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">
            Chamada — {session.class_groups?.name ?? "Turma"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {session.class_groups?.modalities?.name} ·{" "}
            {formatDateOnly(session.date)}
          </p>
        </div>
        <Link
          href={backHref}
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "shrink-0")}
        >
          Voltar
        </Link>
      </div>

      <RollCallClient
        sessionId={session.id}
        initialAttendances={attendances}
        initialClosed={Boolean(session.attendance_closed_at)}
      />
    </div>
  );
}
