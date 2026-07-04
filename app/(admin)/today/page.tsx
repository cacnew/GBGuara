import { TodaysClasses } from "@/components/classes/todays-classes";

export default function AdminTodayPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6 text-foreground">
      <h1 className="font-heading text-2xl font-semibold">Turmas do dia</h1>
      <TodaysClasses />
    </div>
  );
}
