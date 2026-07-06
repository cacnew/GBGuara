import { BackLink } from "@/components/layout/back-link";
import { NewTeacherProfileForm } from "./form";

export default function NewTeacherPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-6 text-foreground">
      <div className="flex w-full max-w-sm items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Novo professor</h1>
        <BackLink href="/teachers" />
      </div>
      <NewTeacherProfileForm />
    </div>
  );
}
