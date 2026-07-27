import { notFound } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { BackLink } from "@/components/layout/back-link";
import { HolidayForm } from "@/components/holidays/holiday-form";
import { getHoliday } from "@/modules/holidays/holidays";

export default async function EditHolidayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const holiday = await getHoliday(id);
  if (!holiday) notFound();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Editar feriado</h1>
        <BackLink href="/calendar/holidays" />
      </div>
      <HolidayForm
        id={id}
        defaultValues={{
          name: holiday.name,
          date: holiday.date,
          recurring: holiday.recurring,
          hasClass: holiday.hasClass,
          customMessage: holiday.customMessage ?? "",
        }}
      />
    </div>
  );
}
