import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export default async function BirthdaysPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const supabase = await createClient();
  const { data: birthdays, count } = await supabase
    .from("birthday_students")
    .select("id, name, phone, photo_url, birth_day", { count: "exact" })
    .order("birth_day")
    .range(...getRange(page));

  const monthName = MONTH_NAMES[new Date().getMonth()];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">
        Aniversariantes de {monthName}
      </h1>

      <div className="space-y-2">
        {birthdays?.map((student) => (
          <Link
            key={student.id}
            href={`/students/${student.id}/edit`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted"
          >
            {student.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photo_url}
                alt={student.name ?? ""}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
                {(student.name ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-muted-foreground">
                Dia {student.birth_day}
                {student.phone ? ` · ${student.phone}` : ""}
              </p>
            </div>
          </Link>
        ))}
        {!birthdays?.length && (
          <p className="text-sm text-muted-foreground">
            Nenhum aniversariante este mês.
          </p>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        basePath="/students/birthdays"
      />
    </div>
  );
}
