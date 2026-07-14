import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudent();

  if (profile.mustChangePassword) {
    redirect("/aluno/nova-senha");
  }

  return (
    <AppShell role="student" userName={profile.name}>
      {children}
    </AppShell>
  );
}
