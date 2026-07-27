import { requireRole } from "@/lib/permissions";
import { BackLink } from "@/components/layout/back-link";
import { HolidayForm } from "@/components/holidays/holiday-form";

export default async function NewHolidayPage() {
  await requireRole("admin");

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Novo feriado</h1>
        <BackLink href="/calendar/holidays" />
      </div>
      <HolidayForm />
    </div>
  );
}
