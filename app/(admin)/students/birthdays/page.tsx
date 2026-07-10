import Link from "next/link";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { BeltWithPreview } from "@/components/belts/belt-preview";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getRange, parsePage } from "@/lib/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "marco",
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
  searchParams: Promise<{ page?: string; columns?: string }>;
}) {
  const { page: pageParam, columns: columnsParam } = await searchParams;
  const page = parsePage(pageParam);
  const columns = ["1", "2", "3", "4"].includes(columnsParam ?? "")
    ? columnsParam ?? "2"
    : "2";
  const supabase = await createClient();
  const { data: birthdays, count } = await supabase
    .from("birthday_students")
    .select("id, name, phone, photo_url, birth_day", { count: "exact" })
    .order("birth_day")
    .range(...getRange(page));

  const birthdayIds = (birthdays ?? [])
    .map((student) => student.id)
    .filter((id): id is string => Boolean(id));

  const { data: studentsWithBelts } = birthdayIds.length
    ? await supabase
        .from("students")
        .select("id, current_degree, belts(name)")
        .in("id", birthdayIds)
    : { data: [] };

  const beltByStudentId = new Map(
    (studentsWithBelts ?? []).map((student) => [
      student.id,
      {
        name: student.belts?.name ?? null,
        degree: student.current_degree,
      },
    ]),
  );

  const monthName = MONTH_NAMES[new Date().getMonth()];
  const gridClass = {
    "1": "grid-cols-1",
    "2": "grid-cols-1 lg:grid-cols-2",
    "3": "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    "4": "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
  }[columns];

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Aniversariantes de {monthName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {count ?? 0} aluno(s) fazem aniversario neste mes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
          <span className="px-2 text-sm font-medium text-muted-foreground">
            Por linha
          </span>
          {["1", "2", "3", "4"].map((value) => (
            <Link
              key={value}
              href={`/students/birthdays?columns=${value}`}
              className={buttonVariants({
                size: "sm",
                variant: columns === value ? "default" : "outline",
                className: "h-8 w-8 rounded-full px-0",
              })}
            >
              {value}
            </Link>
          ))}
        </div>
      </div>

      <div className={cn("grid gap-3", gridClass)}>
        {birthdays?.map((student) => {
          const belt = student.id ? beltByStudentId.get(student.id) : null;

          return (
            <Link
              key={student.id}
              href={`/students/${student.id}/edit`}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted"
            >
              <AvatarInitials
                name={student.name ?? "Aluno"}
                src={student.photo_url}
                className="shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{student.name}</p>
                <div className="text-sm">
                  {belt?.name ? (
                    <BeltWithPreview name={belt.name} degree={belt.degree} />
                  ) : (
                    <span className="text-muted-foreground">Sem faixa</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Dia {student.birth_day}
                  {student.phone ? ` - ${student.phone}` : ""}
                </p>
              </div>
            </Link>
          );
        })}
        {!birthdays?.length && (
          <p className="text-sm text-muted-foreground">
            Nenhum aniversariante este mes.
          </p>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalCount={count ?? 0}
        basePath="/students/birthdays"
        searchParams={{ columns }}
      />
    </div>
  );
}
