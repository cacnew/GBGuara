import Link from "next/link";
import { requireRole } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { HolidayList } from "@/components/holidays/holiday-list";
import { getHolidays } from "@/modules/holidays/holidays";

export default async function HolidaysPage() {
  await requireRole("admin");
  const holidays = await getHolidays();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Feriados e recessos</h1>
          <p className="text-sm text-muted-foreground">
            Feriados nacionais fixos e móveis já vêm pré-cadastrados automaticamente; edite ou
            marque &quot;haverá aula&quot; quando necessário.
          </p>
        </div>
        <Link href="/calendar/holidays/new" className={buttonVariants()}>
          Novo feriado
        </Link>
      </div>
      <HolidayList holidays={holidays} />
    </div>
  );
}
