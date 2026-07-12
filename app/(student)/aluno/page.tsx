import { getStudentAgenda, type AgendaClass } from "@/modules/students/agenda";
import { AgendaClient } from "./agenda-client";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date: Date): Date {
  const weekday = date.getUTCDay(); // 0=domingo … 6=sábado
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() + diffToMonday);
  return monday;
}

export default async function StudentAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const selectedDate = date ?? toISODate(new Date());

  const weekStart = startOfWeek(new Date(`${selectedDate}T00:00:00Z`));
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return toISODate(d);
  });

  const weekAgendas = await Promise.all(weekDates.map((d) => getStudentAgenda(d)));
  const daysWithClasses = weekDates.filter((_, i) => weekAgendas[i].length > 0);
  const selectedIndex = weekDates.indexOf(selectedDate);
  const classes: AgendaClass[] =
    selectedIndex >= 0 ? weekAgendas[selectedIndex] : await getStudentAgenda(selectedDate);

  return (
    <AgendaClient
      weekDates={weekDates}
      daysWithClasses={daysWithClasses}
      selectedDate={selectedDate}
      classes={classes}
    />
  );
}
